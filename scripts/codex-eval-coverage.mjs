// Trusted scheduler bookkeeping only. Never expose parent evidence to evaluated roles.
import { createHash } from "node:crypto";
import { readFile, writeFile, rename } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { auditTrace } from "./codex-eval-environment.mjs";
import { scoringRules, parseTrace, deterministicViolations } from "./run-codex-behavioral-evals.mjs";
const hash = value => createHash("sha256").update(value).digest("hex");
const assert = (ok, message) => { if (!ok) throw new Error(message); };
export const sourceFiles = ["run-codex-behavioral-evals.mjs", "run-codex-comparative-evals.mjs", "codex-eval-environment.mjs"];
const section = (text, start, end) => {
  const a=text.indexOf(start),b=text.indexOf(end,a+start.length);
  assert(a>=0&&b>a,`Cannot identify compatibility section: ${start}`);
  return text.slice(a,b);
};
export function semanticsHash(sources) {
  const c=sources["run-codex-comparative-evals.mjs"],e=sources["codex-eval-environment.mjs"];
  return hash(JSON.stringify([
    sources["run-codex-behavioral-evals.mjs"],
    section(c,"export function neutralPrompt(","export function comparisonSchedule("),
    section(c,"export function blindView(","export function comparisonReport("),
    section(c,"  const contractFor =", "\n  await save();\n  try {"),
    section(c,"        const judgeOrder=", "\n      } catch(error) {\n        pair.error="),
    section(e,"// Local Codex CLI isolation", "export function auditTrace(")
  ]));
}
export async function atomicJson(path, value) {
  await writeFile(path+".tmp",JSON.stringify(value,null,2)+"\n");
  await rename(path+".tmp",path);
}
export function coverageSchedule(schedule, inherited) {
  const seen=new Set(inherited.map(p=>`${p.id}/${p.variant}`));
  return schedule.filter(r=>r.repetition===1&&!seen.has(`${r.fixture.id}/${r.variant.name}`)).map(r=>({...r,stage:"coverage"}));
}
export async function loadCoverageParents({ path, current, schedule, neutralPrompt, resolvePreferences, supportedCitations, legacySource, repoRoot }) {
  const imported=new Map(),parents=[],visited=new Set();
  async function visit(file, expectedHash) {
    file=resolve(file);assert(!visited.has(file),"Duplicate or cyclic coverage parent");visited.add(file);
    const bytes=await readFile(file),digest=hash(bytes);
    assert(!expectedHash||digest===expectedHash,"Parent manifest changed after checkpoint");
    const parent=JSON.parse(bytes);
    assert(parent.preflight?.status==="passed"&&parent.readiness?.status==="passed","Parent never passed infrastructure/readiness");
    for(const key of ["skillHash","codexVersion"])assert(parent[key]===current[key],`Incompatible parent ${key}`);
    for(const key of ["model","judgeModel","effort","seed","timeoutSeconds"])assert(parent.config[key]===current.config[key],`Incompatible parent ${key}`);
    for(const key of ["cases","coverage","codex-grade.schema.json","codex-comparison-gate.schema.json","codex-pairwise.schema.json"])assert(parent.hashes[key]===current.hashes[key],`Incompatible parent ${key}`);
    if(parent.hashes.scoringRules)assert(parent.hashes.scoringRules===current.hashes.scoringRules,"Incompatible parent scoring rules");
    else {
      assert(legacySource,"Legacy parent requires scoring-rule source snapshot");
      const protocol=await readFile(join(legacySource,"protocol.md"),"utf8");
      assert(hash(protocol)===parent.hashes.protocol,"Legacy protocol hash mismatch");
      assert(hash(JSON.stringify(scoringRules(protocol)))===current.hashes.scoringRules,"Incompatible legacy scoring rules");
    }
    if(parent.semanticsHash)assert(parent.semanticsHash===current.semanticsHash,"Incompatible judging or execution semantics");
    else {
      assert(legacySource,"Legacy parent requires --legacy-source with hash-verified runner snapshots");
      const sources={};
      for(const name of sourceFiles) {
        sources[name]=await readFile(join(legacySource,name),"utf8");
        assert(hash(sources[name])===parent.hashes[name],`Legacy source hash mismatch: ${name}`);
      }
      assert(semanticsHash(sources)===current.semanticsHash,"Incompatible legacy judging or execution semantics");
    }
    for(const ancestor of parent.parents??[]) {
      for(const [artifact,digest] of Object.entries(ancestor.artifacts??{}))assert(hash(await readFile(join(dirname(ancestor.path),artifact)))===digest,"Parent artifact changed after checkpoint");
      await visit(ancestor.path,ancestor.hash);
    }
    const artifacts={};
    for(const pair of parent.pairs.filter(p=>p.status==="valid"&&p.repetition===1)) {
      const run=schedule.find(r=>r.fixture.id===pair.id&&r.variant.name===pair.variant&&r.repetition===1);
      assert(run&&pair.label===`${pair.id}-${pair.variant}-1`,"Unexpected parent pair identity");
      const evidence=await readFile(join(dirname(file),pair.label,"evidence.json"));
      assert(JSON.stringify(JSON.parse(evidence))===JSON.stringify(pair),"Parent pair evidence differs from manifest");
      artifacts[`${pair.label}/evidence.json`]=hash(evidence);
      assert(pair.promptHash===hash(neutralPrompt(run.fixture)),"Parent neutral prompt hash mismatch");
      for(const arm of ["baseline","candidate"]) {
        const a=pair[arm];assert(a.execution==="completed"&&!a.incomplete&&a.turns?.length,"Incomplete parent interaction");
        assert(a.turns[0].prompt===neutralPrompt(run.fixture),"Parent arm prompt mismatch");
        if(a.turns.length>1)assert(a.turns.length===2&&a.turns[1].prompt===run.variant.followup,"Parent continuation mismatch");
        assert(a.settings.model===current.config.model&&a.settings.effort===current.config.effort,"Parent arm settings mismatch");
        assert(arm!=="baseline"||a.inventory.length===0,"Parent baseline has Skills");
        assert(arm!=="candidate"||a.inventory.length===1&&a.inventory[0].name==="helpwright:helpwright","Parent candidate inventory mismatch");
        const deterministic=a.turns.flatMap(t=>deterministicViolations(pair.id,t.response));
        assert(JSON.stringify(a.deterministic)===JSON.stringify(deterministic),"Parent deterministic checks mismatch");
        assert(a.outcome===(a.grade.violatedProhibitedBehaviors.length||deterministic.length?"fail":a.grade.outcome),"Parent absolute outcome mismatch");
      }
      let comparisons=0;
      for(const call of parent.calls.filter(c=>c.artifact.startsWith(pair.label+"/"))) {
        assert(!call.artifact.includes(".."),"Invalid parent artifact path");
        for(const ext of ["prompt.txt","jsonl","startup.json"]) {
          const data=await readFile(join(dirname(file),`${call.artifact}.${ext}`));artifacts[`${call.artifact}.${ext}`]=hash(data);
        }
        if(call.role==="generation") {
          const arm=/\/candidate-/.test(call.artifact)?"candidate":"baseline";
          const turn=Number(call.artifact.match(/-(1|2)(?:-retry)?$/)?.[1]);
          assert(turn&&await readFile(join(dirname(file),`${call.artifact}.prompt.txt`),"utf8")===pair[arm].turns[turn-1]?.prompt,"Saved parent generation prompt mismatch");
        }
        const trace=await readFile(join(dirname(file),`${call.artifact}.jsonl`),"utf8");
        const events=trace.split("\n").filter(Boolean).map(l=>JSON.parse(l));
        const arm=/\/candidate-/.test(call.artifact)?"candidate":"baseline";
        const response=parseTrace(trace).response;
        if(call.role==="generation") {
          const turn=Number(call.artifact.match(/-(1|2)(?:-retry)?$/)?.[1]);
          assert(response===pair[arm].turns[turn-1]?.response,"Parent response differs from execution trace");
        } else {
          const value=JSON.parse(response);
          if(call.role==="grade")assert(JSON.stringify(value)===JSON.stringify(pair[arm].grade),"Parent grade differs from judge trace");
          if(call.role==="gate") {
            const n=Number(call.artifact.match(/-(\d+)(?:-retry)?$/)?.[1]);
            assert(JSON.stringify(value)===JSON.stringify(pair[arm].gate?.decisions[n-1]),"Parent gate differs from judge trace");
          }
          if(call.role==="pair") {
            const j=pair.judgments[comparisons++];assert(j,"Missing parent comparison");
            for(const [key,v] of Object.entries(value))assert(JSON.stringify(v)===JSON.stringify(key==="preference"?j.rawPreference:key==="confidence"?j.reportedConfidence:j[key]),"Parent comparison differs from judge trace");
            const prompt=await readFile(join(dirname(file),`${call.artifact}.prompt.txt`),"utf8");
            const view=JSON.parse(prompt.slice(prompt.lastIndexOf("\n")+1));
            const supported=supportedCitations(value,view);
            assert(j.confidence===(supported?value.confidence:"low"),"Parent comparison confidence mismatch");
            assert(j.preference===(value.preference==="A"?j.order[0]:value.preference==="B"?j.order[1]:value.preference),"Parent comparison arm mapping mismatch");
          }
        }
        const settings=pair[arm].settings;
        // Audit all roles, including graders/gates, using their own saved startup cwd.
        const startup=JSON.parse(await readFile(join(dirname(file),`${call.artifact}.startup.json`),"utf8"));
        const startupText=JSON.stringify(startup);
        const cwd=startupText.match(/<cwd>([^<]+)<\/cwd>/)?.[1]??settings.cwd;
        const dir=dirname(cwd),tempRoot=dirname(dir);
        auditTrace(events,{cwd,skillRoot:join(dir,"codex/plugins/cache")},{repoRoot,tempRoot,model:call.role==="generation"?current.config.model:current.config.judgeModel});
      }
      assert(comparisons===pair.judgments.length&&comparisons>0,"Parent comparison count mismatch");
      const critical=Object.fromEntries(["baseline","candidate"].map(arm=>[arm,[...new Set([...pair[arm].deterministic,...pair.judgments.flatMap(j=>j.order[0]===arm?j.criticalViolationsA:j.criticalViolationsB)])]]));
      assert(JSON.stringify(critical)===JSON.stringify(pair.critical),"Parent critical findings mismatch");
      let preference=resolvePreferences(pair.judgments);
      if(critical.candidate.length&&preference==="candidate"&&!critical.baseline.length||critical.baseline.length&&preference==="baseline"&&!critical.candidate.length)preference="unresolved";
      assert(preference===pair.preference,"Parent resolved comparison mismatch");
      const key=`${pair.id}/${pair.variant}`;
      assert(!imported.has(key),"Duplicate completed coverage in parent chain");
      imported.set(key,{...pair,origin:{manifest:file,manifestHash:digest,evidence:join(dirname(file),pair.label,"evidence.json")}});
    }
    parents.push({path:file,hash:digest,artifacts});
  }
  if(path)await visit(path);
  return {pairs:[...imported.values()],parents};
}
