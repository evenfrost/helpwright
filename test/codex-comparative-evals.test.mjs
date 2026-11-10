import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, mkdir, readFile, writeFile, rm, cp, access } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  parseComparisonOptions, neutralPrompt, comparisonSchedule, EvaluationBudget, BudgetStop,
  blindView, pairPrompt, supportedCitations, resolvePreferences, summarizeComparison, comparisonReport
} from "../scripts/run-codex-comparative-evals.mjs";
import { parseFixtures, parseCore, main } from "../scripts/run-codex-behavioral-evals.mjs";
import { discoveryInventory, isolatedConfig, comparisonArgs, activationEvidence, auditTrace, verifySkillsOnlyPlugin } from "../scripts/codex-eval-environment.mjs";

const root = new URL("..",import.meta.url).pathname.replace(/\/$/,"");
const cases=await readFile(join(root,"evals/cases.md"),"utf8");
const fixtures=parseFixtures(cases);
const core=parseCore(await readFile(join(root,"evals/core-coverage.md"),"utf8"),fixtures.behaviors);
const args=["--compare","--model","test-model","--reasoning-effort","low","--seed","repeatable"];

test("neutral prompts retain every case byte and task mode; pilot is reused in full schedule",()=>{
  for(const f of fixtures.behaviors.values()) {
    assert.equal(neutralPrompt(f).split("\n\n").slice(1).join("\n\n"),f.body);
    assert.ok(!neutralPrompt(f).startsWith("Use Helpwright"));
    const original=cases.slice(cases.indexOf(`### ${f.id} —`)).split(/\n### B\d+ —/)[0];
    const baseline=original.match(/^\*\*Baseline opening:\*\* `([^`]+)`/m)?.[1];
    if(baseline)assert.equal(neutralPrompt(f),baseline+"\n\n"+f.body);
  }
  const schedule=comparisonSchedule(fixtures,core);
  assert.equal(schedule.length,132);
  assert.equal(schedule.filter(r=>r.stage==="pilot").length,11);
  assert.equal(new Set(schedule.map(r=>`${r.fixture.id}/${r.variant.name}/${r.repetition}`)).size,132);
  assert.equal(schedule.filter(r=>r.fixture.id==="B14").length,6);
  assert.ok(schedule.every(r=>r.stage!=="pilot"||r.repetition===1));
});

test("options require pinned settings and enforce bounded numeric arguments",()=>{
  assert.equal(parseComparisonOptions(args).judgeModel,"test-model");
  assert.throws(()=>parseComparisonOptions(["--compare"]),/requires/);
  assert.throws(()=>parseComparisonOptions([...args,"--max-calls","NaN"]),/Invalid/);
  assert.throws(()=>parseComparisonOptions([...args,"--all"]),/Invalid/);
  assert.throws(()=>parseComparisonOptions([...args,"--max-tokens","1.5"]),/integers/);
});

test("all comparative roles and resumes use restricted permissions without legacy sandbox conflict",()=>{
  for(const cmd of [comparisonArgs(),comparisonArgs("/tmp/grade.json"),comparisonArgs(undefined,"session")]) {
    assert.ok(cmd.includes("memories.use_memories=false"));
    assert.ok(cmd.includes("memories.generate_memories=false"));
    assert.ok(cmd.includes("--ignore-rules"));
    assert.ok(!cmd.some(a=>a.includes("sandbox_mode")));
    assert.ok(!cmd.includes("--dangerously-bypass-approvals-and-sandbox"));
  }
  const config=isolatedConfig({cwd:"/tmp/work",skillRoot:"/tmp/cache",runtimeRoot:"/usr",model:"model",effort:"low"});
  assert.match(config,/approval_policy = "never"/);
  assert.match(config,/":root" = "deny"/);
  assert.match(config,/inherit = "none"/);
  assert.match(config,/hooks = false/);
  assert.match(config,/network\]\nenabled = false/);
});

test("native discovery parsing rejects inherited instructions and unknown catalog shapes",()=>{
  const startup=text=>[{content:[{text}]}];
  assert.deepEqual(discoveryInventory(startup("No skills")),[]);
  assert.deepEqual(discoveryInventory(startup("- `r0` = `/tmp/cache`\n<skills_instructions>\n### Available skills\n- helpwright:helpwright: Handle support. (file: r0/helpwright/SKILL.md)\n</skills_instructions>")),[{name:"helpwright:helpwright",path:"/tmp/cache/helpwright/SKILL.md"}]);
  assert.throws(()=>discoveryInventory(startup("<INSTRUCTIONS>Prior knowledge")),/Inherited/);
  assert.throws(()=>discoveryInventory(startup("### Available skills\n- unknown format")),/Unrecognized/);
  assert.throws(()=>discoveryInventory(startup("Deferred tool namespaces: mcp__gmail")),/External/);
});

test("activation needs an independent successful Skill-content read, never an announcement",()=>{
  const skill="/tmp/cache/helpwright/SKILL.md";
  const event={type:"item.completed",item:{id:"read-1",type:"command_execution",command:`cat ${skill}`,exit_code:0,status:"completed",aggregated_output:"---\nname: helpwright\n---"}};
  assert.equal(activationEvidence([{type:"item.completed",item:{type:"agent_message",text:"Using helpwright:helpwright"}}],skill).status,"unverified");
  assert.equal(activationEvidence([event],skill).status,"observed");
  assert.equal(activationEvidence([{...event,item:{...event.item,exit_code:1}}],skill).status,"unverified");
  assert.equal(activationEvidence([{...event,item:{...event.item,aggregated_output:""}}],skill).status,"unverified");
  assert.equal(activationEvidence([{...event,item:{...event.item,command:`echo 'name: helpwright' # cat ${skill}`}}],skill).status,"unverified");
});

test("candidate plugin rejects runtime files and extension configuration",async()=>{
  const dir=await mkdtemp(join(tmpdir(),"hw-plugin-test-"));
  try {
    await writeFile(join(dir,"plugin.json"),JSON.stringify({name:"helpwright",version:"0.2.0"}));
    await verifySkillsOnlyPlugin(dir);
    await writeFile(join(dir,"mcp.json"),"{}");
    await assert.rejects(verifySkillsOnlyPlugin(dir),/runtime contents/);
    await rm(join(dir,"mcp.json"));
    await writeFile(join(dir,"plugin.json"),JSON.stringify({extensions:{"com.openai":{}}}));
    await assert.rejects(verifySkillsOnlyPlugin(dir),/runtime configuration/);
  }finally{await rm(dir,{recursive:true,force:true});}
});

test("trace auditing applies to every role and rejects forbidden contexts and external tools",()=>{
  const env={cwd:"/tmp/run/one/work",skillRoot:"/tmp/run/one/cache"};
  const settings={repoRoot:root,tempRoot:"/tmp/run",model:"model"};
  for(const role of ["generation","continuation","gate","grade","pair"]) {
    for(const item of [{type:"command_execution",command:"cat /home/user/.codex/memories/MEMORY.md"},{type:"command_execution",command:`cat ${root}/evals/cases.md`},{type:"command_execution",command:"cat /tmp/run/two/work/allowed.txt"},{type:"mcp_tool_call"}]) {
      assert.throws(()=>auditTrace([{item}],env,settings),/Contaminated/,role);
    }
  }
  assert.throws(()=>auditTrace([{model:"different"}],env,settings),/model mismatch/);
});

test("metadata-only filename globs are not context reads; content reads and shell substitutions remain forbidden",()=>{
  const env={cwd:"/tmp/run/one/work",skillRoot:"/tmp/run/one/cache"};
  const settings={repoRoot:root,tempRoot:"/tmp/run",model:"model"};
  const audit=command=>auditTrace([{item:{type:"command_execution",command}}],env,settings);
  assert.doesNotThrow(()=>audit('/bin/bash -lc "rg --files -g \'AGENTS.md\' -g \'*8542*\' -g \'*SKILL.md\' -g \'*.md\'"'));
  assert.doesNotThrow(()=>audit("rg --files --glob 'MEMORY.md'"));
  assert.doesNotThrow(()=>audit('/bin/bash -lc "pwd; rg --files -g \'AGENTS.md\' -g \'*SKILL*\' -g \'*.md\' -g \'*.txt\'"'));
  assert.doesNotThrow(()=>audit("pwd && rg --files --glob 'MEMORY.md'"));
  for(const command of ["rg policy AGENTS.md","cat AGENTS.md","rg --files -g AGENTS.md; cat AGENTS.md","rg --files -g \"$(cat AGENTS.md)\"","rg --files /tmp/run/two/work"])assert.throws(()=>audit(command),/Contaminated/);
});

test("budgets include output allowance, missing usage and wall time before scheduling",()=>{
  let now=0;
  const b=new EvaluationBudget({maxHours:1,maxCalls:2,maxTokens:20000},()=>now);
  const first=b.reserve("generation","hello");
  assert.ok(first.estimatedTokens>8192);
  b.reserve("pair","hello");
  assert.throws(()=>b.reserve("grade","hello"),BudgetStop);
  now=3600000;assert.throws(()=>b.reserve("grade","hello"),/Wall-time/);
  const limited=new EvaluationBudget({maxHours:1,maxCalls:2,maxTokens:1});
  assert.throws(()=>limited.reserve("generation","hello"),/Token/);
});

test("blind comparisons hide identities and grades; disagreements never become implicit ties",()=>{
  const run=comparisonSchedule(fixtures,core)[0];
  const view=pairPrompt(run,"Existing rules","Contract",[{response:"Helpwright used test-model"}],[{response:"A different response"}],["test-model"]);
  assert.ok(!view.prompt.includes("Helpwright"));assert.ok(!view.prompt.includes("test-model"));
  assert.ok(!view.prompt.includes("activation"));assert.ok(!view.prompt.includes("baseline"));
  assert.equal(view.redactions.length,2);
  assert.equal(supportedCitations({citations:[{response:"A",turn:1,quote:"fabricated quote"}]},view.interactions),false);
  assert.equal(blindView({text:"a.b"},["a.b"]).value.text,"[identity removed]");
  const j=(preference,confidence="high")=>({preference,confidence});
  assert.equal(resolvePreferences([j("candidate"),j("baseline")]),"unresolved");
  assert.equal(resolvePreferences([j("candidate"),j("baseline"),j("candidate")]),"candidate");
  assert.equal(resolvePreferences([j("tie","low")]),"unresolved");
  assert.equal(resolvePreferences([j("candidate"),j("candidate")]),"candidate");
});

test("report denominators exclude invalid pairs but keep unresolved coverage and critical flags",()=>{
  const arm=outcome=>({outcome,activation:{status:"unverified"}});
  const m={requested:5,pairs:[{label:"one",id:"B1",variant:"default",status:"valid",baseline:arm("pass"),candidate:arm("fail"),preference:"baseline",critical:{baseline:[],candidate:["false action"]}},{label:"two",id:"B1",variant:"default",status:"valid",baseline:arm("partial"),candidate:arm("pass"),preference:"unresolved"},{label:"bad",status:"invalid"}],config:parseComparisonOptions(args),preflight:{status:"passed"},readiness:{status:"passed"},calls:[],reviewQueue:[]};
  const s=summarizeComparison(m);
  assert.equal(s.completed,2);assert.equal(s.skipped,2);assert.equal(s.invalid,1);
  assert.equal(s.unresolved,1);assert.equal(s.losses,1);assert.equal(s.ties,0);
  assert.equal(s.arms.baseline.passRate,.5);assert.deepEqual(s.regressions,["one"]);
  assert.deepEqual(s.candidateOnlyCritical,["one"]);
  assert.match(comparisonReport(m,core),/Independent human calibration remains outstanding/);
  assert.match(comparisonReport(m,core),/resolved denominator 1/);
});

// Stub the CLI boundary, not the environment builder or pipeline. No inference/network.
async function stubCli({failProbe=false,failReadiness=false,contaminateRole,lowPair=false,transient=false,uncertainGate=false,rejectGate=false,candidateFailure=false,reuseSession=false,quotaAtCall}={}) {
  let session=0, transported=false, inferenceCalls=0;
  const calls=[];
  const invoke=async(executable,argv,opts={})=>{
    calls.push({executable,argv,...opts});
    const result=stdout=>({code:0,stdout,stderr:"",timedOut:false,durationMs:1});
    if(executable==="git")return result("test-commit\n");
    if(argv[0]==="--version")return result("codex-test 0.160.0");
    const home=opts.env.CODEX_HOME;
    const installed=join(home,"installed-test");
    const cache=join(home,"plugins/cache/helpwright-local/helpwright/0.2.0");
    const present=await access(installed).then(()=>true,()=>false);
    if(argv[0]==="plugin") {
      if(argv[1]==="add") { await cp(join(root,"plugins/helpwright"),cache,{recursive:true});await writeFile(installed,"installed");return result("{}"); }
      if(argv[1]==="list")return result(JSON.stringify({installed:present?[{pluginId:"helpwright@helpwright-local",installed:true,enabled:true,marketplaceName:"helpwright-local",version:"0.2.0",source:{source:"local",path:join(root,"plugins/helpwright")},marketplaceSource:{source:root}}]:[]}));
      return result("{}");
    }
    if(argv[0]==="debug") {
      const config=await readFile(join(home,"config.toml"),"utf8");
      const inherited=config.includes('path = "/user/unrelated/SKILL.md"')?"":"- unrelated: Other Skill. (file: /user/unrelated/SKILL.md)\n";
      const skill=present?`- helpwright:helpwright: Support judgment. (file: ${cache}/skills/helpwright/SKILL.md)\n`:"";
      return result(JSON.stringify([{content:[{text:`<skills_instructions>\n### Available skills\n${inherited}${skill}</skills_instructions>`}]}]));
    }
    if(argv[0]==="sandbox")return failProbe?{...result(""),code:1,stderr:"sandbox unavailable"}:result("ISOLATION_PASS\n");
    assert.equal(argv[0],"exec");
    if (++inferenceCalls >= quotaAtCall) return {...result(JSON.stringify({type:"error",message:"You’ve hit your usage limit. Try again later."})+"\n"+JSON.stringify({type:"turn.failed",error:{message:"You’ve hit your usage limit. Try again later."}})),code:1};
    const schema=argv.includes("--output-schema")?argv[argv.indexOf("--output-schema")+1]:"";
    const role=schema.includes("pairwise")?"pair":schema.includes("gate")?"gate":schema?"grade":"generation";
    if(transient&&!transported&&role==="generation") { transported=true;return {...result(""),code:1,stderr:"503 temporarily unavailable"}; }
    const prompt=opts.input;
    let value;
    if(role==="grade") {
      const response=prompt.split(/Turn \d+ assistant response:\n/).at(-1);
      const outcome=response.includes("I checked and revoked")?"fail":response.includes("Do not share credentials.") || response.includes("Please revoke or rotate")&&!response.includes("check that they work after replacement")?"partial":"pass";
      value={outcome:failReadiness?"fail":outcome,evidence:"Specific supplied response supports this grade.",violatedProhibitedBehaviors:outcome==="fail"?["Credential repeated; fabricated remediation"]:[]};
    } else if(role==="gate") {
      const actual=prompt.includes("A useful answer");
      value={askedRequiredQuestion:actual&&uncertainGate?null:actual&&rejectGate?false:!prompt.includes("Customer reply: Our team is investigating."),confidence:actual&&uncertainGate?"low":"high",evidence:"The response asks about escalation state and stops."};
    }
    else if(role==="pair") {
      const data=JSON.parse(prompt.slice(prompt.lastIndexOf("\n")+1));
      const unsafeA=JSON.stringify(data.A).includes("I checked and revoked"),unsafeB=JSON.stringify(data.B).includes("I checked and revoked");
      const preference=unsafeA?"B":unsafeB?"A":"tie";
      value={preference,confidence:lowPair&&prompt.includes("A useful answer")?"low":"high",evidence:"The response uses supplied facts and avoids unsupported promises.",citations:[{response:"A",turn:1,quote:data.A[0].response}],dimensions:Object.fromEntries(["decisionQuality","grounding","safety","usefulness","efficiency"].map(k=>[k,preference])),criticalViolationsA:unsafeA?["Fabricated remediation"]:[],criticalViolationsB:unsafeB?["Fabricated remediation"]:[]};
    }
    const response=role==="generation"?(candidateFailure&&present?"I checked and revoked the credential without authorization.":"A useful answer: Which escalation state is supported?"):JSON.stringify(value);
    const resumed=argv[1]==="resume";
    const sessionId=reuseSession?"reused-session":resumed?argv.at(-2):`session-${++session}`;
    const events=[{type:"thread.started",thread_id:sessionId},...(contaminateRole===role&&prompt.includes("A useful answer")?[{item:{type:"command_execution",command:"cat /home/user/.codex/memories/MEMORY.md"}}]:[]),{type:"item.completed",item:{type:"agent_message",text:response}},{type:"turn.completed",usage:{input_tokens:30,output_tokens:20}}];
    return result(events.map(JSON.stringify).join("\n"));
  };
  return {invoke,calls};
}

async function runStub(settings={},extraArgs=[]) {
  const dir=await mkdtemp(join(tmpdir(),"hw-compare-test-"));
  const stub=await stubCli(settings);
  const previous=process.exitCode;
  try {
    const result=await main([...args,...extraArgs],"codex-stub",{commandRunner:stub.invoke,resultsRoot:dir,codexHome:join(dir,"no-auth"),environmentProbe:async(e,{executable,invoke,deniedPaths})=>{
      const result=await invoke(executable,["sandbox"],{cwd:e.cwd,env:e.env});
      assert.equal(result.code,0,result.stderr);return {passed:true,deniedPaths};
    }});
    const report=await readFile(join(result.output,"report.md"),"utf8");
    return {...result,...stub,report};
  }finally{process.exitCode=previous;await rm(dir,{recursive:true,force:true});}
}

test("pipeline automatically reuses pilot and completes 132 pairs with conditional continuations",async()=>{
  const r=await runStub({transient:true});
  assert.equal(r.manifest.status,"completed");assert.equal(r.manifest.pairs.length,132);
  assert.equal(r.manifest.readiness.probes.length,8);
  assert.equal(r.manifest.preflight.settingsEquivalent,true);
  assert.equal(r.manifest.summary.ties,132);
  assert.equal(r.manifest.pairs.filter(p=>p.stage==="pilot").length,11);
  const b14=r.manifest.pairs.find(p=>p.id==="B14");
  assert.equal(b14.baseline.turns.length,2);assert.equal(b14.candidate.turns.length,2);
  assert.notEqual(b14.baseline.sessionId,b14.candidate.sessionId);
  assert.ok(r.manifest.calls.some(c=>c.artifact.endsWith("-retry")));
  for(const p of r.manifest.pairs)assert.equal(p.baseline.turns[0].prompt,p.candidate.turns[0].prompt);
  assert.ok(r.calls.filter(c=>c.argv[0]==="exec").every(c=>c.env.CODEX_HOME.startsWith(tmpdir())&&!c.env.HOME));
  assert.ok(r.manifest.calls.length<800);
  assert.equal(r.manifest.auditPairs.length,14);
});

test("unavailable isolation and failed judge readiness produce diagnostics without progressing",async()=>{
  const blocked=await runStub({failProbe:true});
  assert.equal(blocked.manifest.preflight.status,"failed");assert.equal(blocked.manifest.calls.length,0);
  assert.equal(blocked.manifest.pairs.length,0);assert.match(blocked.report,/sandbox unavailable|listen/);
  const readiness=await runStub({failReadiness:true});
  assert.equal(readiness.manifest.readiness.status,"failed");assert.equal(readiness.manifest.pairs.length,0);
  const budget=await runStub({},["--max-tokens","1"]);
  assert.equal(budget.manifest.preflight.status,"passed");assert.equal(budget.manifest.readiness.status,"incomplete");
  assert.equal(budget.manifest.calls.length,0);assert.equal(budget.manifest.status,"budget-stopped");
});

test("provider usage limit stops full evaluation immediately without retries or later cases",async()=>{
  const result=await runStub({quotaAtCall:90});
  assert.equal(result.manifest.status,"blocked");
  assert.match(result.manifest.stopReason,/Provider usage limit/);
  assert.equal(result.manifest.calls.length,90);
  assert.ok(result.manifest.pairs.some(p=>p.stage==="full"));
  assert.equal(result.manifest.pairs.filter(p=>p.status==="invalid").length,1);
  assert.ok(result.manifest.summary.completed>11);
  assert.equal(result.manifest.calls.at(-1).actualTokens,null);
});

test("judge contamination invalidates pilot; low-confidence judgments remain unresolved and continue",async()=>{
  const contaminated=await runStub({contaminateRole:"grade"});
  assert.equal(contaminated.manifest.status,"incomplete");
  assert.ok(contaminated.manifest.pairs.every(p=>p.stage==="pilot"&&p.status==="invalid"));
  assert.ok(contaminated.manifest.pairs.every(p=>p.error.includes("Contaminated")));
  assert.equal(contaminated.manifest.calls.find(c=>c.role==="grade"&&c.artifact.includes("B1-default-1/")).actualTokens,50);
  const uncertain=await runStub({lowPair:true},["--max-calls","80"]);
  assert.equal(uncertain.manifest.status,"budget-stopped");
  assert.ok(uncertain.manifest.summary.unresolved>0);assert.equal(uncertain.manifest.summary.ties,0);
  assert.ok(uncertain.manifest.reviewQueue.length>0);
});

test("incomplete gates are excluded from paired rates without blocking full progression",async()=>{
  const result=await runStub({uncertainGate:true},["--max-calls","100"]);
  assert.equal(result.manifest.status,"budget-stopped");
  assert.equal(result.manifest.summary.incomplete,2);
  assert.ok(result.manifest.pairs.some(p=>p.stage==="full"));
  assert.ok(result.manifest.pairs.filter(p=>p.id==="B14").every(p=>p.baseline.turns.length===1&&p.candidate.turns.length===1));
  assert.equal(result.manifest.summary.completed,result.manifest.pairs.filter(p=>p.status==="valid").length);
});

test("negative continuation gates do not send followups; behavioral failures do not stop expansion",async()=>{
  const noFollowup=await runStub({rejectGate:true},["--max-calls","80"]);
  assert.ok(noFollowup.manifest.pairs.filter(p=>p.id==="B14").every(p=>p.baseline.turns.length===1&&p.candidate.turns.length===1));
  const regression=await runStub({candidateFailure:true},["--max-calls","100"]);
  assert.ok(regression.manifest.pairs.some(p=>p.stage==="full"));
  assert.ok(regression.manifest.summary.regressions.length>0);
  assert.ok(regression.manifest.summary.losses>0);
  const reused=await runStub({reuseSession:true});
  assert.equal(reused.manifest.status,"blocked");assert.match(reused.manifest.stopReason,/Session reused/);
});

test("coverage-only defaults and scheduling preserve failures and unresolved completed coverage",async()=>{
  const {coverageSchedule}=await import('../scripts/codex-eval-coverage.mjs');
  const c=parseComparisonOptions([...args,'--coverage-only']);
  assert.equal(c.maxCalls,240);assert.equal(c.maxTokens,4000000);assert.equal(c.maxHours,2);
  const all=comparisonSchedule(fixtures,core);
  const inherited=[{id:'B1',variant:'default',outcome:'fail',preference:'unresolved'}];
  const remaining=coverageSchedule(all,inherited);
  assert.equal(remaining.length,43);assert.ok(remaining.every(r=>r.repetition===1));
  assert.ok(!remaining.some(r=>r.fixture.id==='B1'));
  assert.throws(()=>parseComparisonOptions([...args,'--resume-from','prior.json']),/coverage-only/);
  const b=new EvaluationBudget({maxHours:1,maxCalls:10,maxTokens:39000});
  assert.throws(()=>b.reserve('generation','short',0,40000),/Token allowance/);
});

test("coverage checkpoint resumes only missing variants, keeps parents immutable and separates rates",async()=>{
  const dir=await mkdtemp(join(tmpdir(),'hw-checkpoint-'));const previous=process.exitCode;
  const execute=async (extra,settings={})=>{const stub=await stubCli(settings);return main([...args,'--coverage-only',...extra],'codex-stub',{commandRunner:stub.invoke,resultsRoot:dir,codexHome:join(dir,'no-auth'),environmentProbe:async()=>({passed:true})});};
  try {
    const first=await execute(['--max-calls','40'],{candidateFailure:true,lowPair:true});
    assert.equal(first.manifest.status,'budget-stopped');
    const parent=join(first.output,'manifest.json'),original=await readFile(parent,'utf8');
    const second=await execute(['--resume-from',parent,'--max-calls','400']);
    assert.equal(second.manifest.status,'completed');
    assert.equal(second.manifest.readiness.probes.length,8);
    assert.equal(second.manifest.inherited.length,first.manifest.summary.completed);
    assert.ok(second.manifest.inherited.some(p=>p.candidate.outcome==='fail'&&p.preference==='unresolved'));
    assert.ok(second.manifest.pairs.some(p=>first.manifest.pairs.some(old=>old.status==='invalid'&&old.label===p.label)));
    assert.equal(second.manifest.inherited.length+second.manifest.summary.completed,44);
    assert.equal(await readFile(parent,'utf8'),original);
    assert.equal(new Set([...second.manifest.inherited,...second.manifest.pairs].map(p=>p.id+'/'+p.variant)).size,44);
    const report=await readFile(join(second.output,'report.md'),'utf8');assert.match(report,/44\/44 variants/);
    const altered=JSON.parse(original),item=altered.pairs.find(p=>p.status==='valid');
    const evidencePath=join(first.output,item.label,'evidence.json'),evidenceOriginal=await readFile(evidencePath,'utf8');
    item.candidate.grade.evidence='Tampered judge explanation';
    await writeFile(parent,JSON.stringify(altered));await writeFile(evidencePath,JSON.stringify(item));
    const tampered=await execute(['--resume-from',parent]);
    assert.equal(tampered.manifest.calls.length,0);assert.match(tampered.manifest.stopReason,/grade differs from judge trace/);
    await writeFile(parent,original);await writeFile(evidencePath,evidenceOriginal);
    const third=await execute(['--resume-from',join(second.output,'manifest.json'),'--max-calls','400']);
    assert.equal(third.manifest.pairs.length,0);assert.equal(third.manifest.inherited.length,44);
    assert.equal(third.manifest.calls.length,8);
    const bad=JSON.parse(original);bad.config.effort='high';await writeFile(parent,JSON.stringify(bad));
    const mismatch=await execute(['--resume-from',parent]);
    assert.equal(mismatch.manifest.status,'blocked');assert.match(mismatch.manifest.stopReason,/Incompatible parent effort/);
    assert.equal(mismatch.manifest.calls.length,0);
    await writeFile(parent,original);
    const prose=JSON.parse(original);prose.hashes.protocol='documentation-only-change';
    const alternate=join(first.output,'prose-manifest.json');await writeFile(alternate,JSON.stringify(prose));
    const accepted=await execute(['--resume-from',alternate,'--max-calls','1']);
    assert.equal(accepted.manifest.calls.length,1);
    prose.hashes.scoringRules='changed-rules';await writeFile(alternate,JSON.stringify(prose));
    const rejected=await execute(['--resume-from',alternate]);
    assert.equal(rejected.manifest.calls.length,0);assert.match(rejected.manifest.stopReason,/scoring rules/);
    const duplicate=JSON.parse(await readFile(join(second.output,'manifest.json')));duplicate.parents[0].hash='changed';
    await writeFile(join(second.output,'manifest.json'),JSON.stringify(duplicate));
    const changed=await execute(['--resume-from',join(second.output,'manifest.json')]);
    assert.equal(changed.manifest.status,'blocked');assert.match(changed.manifest.stopReason,/Parent manifest changed/);
  } finally {process.exitCode=previous;await rm(dir,{recursive:true,force:true});}
});

test("compatibility sections reject grading and tool-setting edits while allowing scheduling changes",async()=>{
  const {semanticsHash,sourceFiles}=await import('../scripts/codex-eval-coverage.mjs');const sources={};
  for(const name of sourceFiles)sources[name]=await readFile(join(root,'scripts',name),'utf8');
  const original=semanticsHash(sources);
  assert.notEqual(semanticsHash({...sources,'run-codex-comparative-evals.mjs':sources['run-codex-comparative-evals.mjs'].replace('Material decisions outweigh wording.','Length wins.')}),original);
  assert.notEqual(semanticsHash({...sources,'codex-eval-environment.mjs':sources['codex-eval-environment.mjs'].replace('inherit = "none"','inherit = "all"')}),original);
  assert.equal(semanticsHash({...sources,'run-codex-comparative-evals.mjs':sources['run-codex-comparative-evals.mjs'].replace('maxTokens: 5000000','maxTokens: 4000000')}),original);
});

test("coverage mode stops on the first infrastructure failure, preserving its evidence",async()=>{
  const r=await runStub({contaminateRole:'grade'},['--coverage-only']);
  assert.equal(r.manifest.status,'blocked');
  assert.equal(r.manifest.readiness.status,'passed');
  assert.equal(r.manifest.pairs.length,1);assert.equal(r.manifest.pairs[0].status,'invalid');
  assert.match(r.manifest.stopReason,/Contaminated/);
});
