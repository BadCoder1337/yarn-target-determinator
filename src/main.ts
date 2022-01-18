import * as core from "@actions/core";

import listYarnWorkspaces from "./listYarnWorkspaces";
import YarnGraph from "./YarnGraph";

const main = async (): Promise<void> => {
  try {
    const files: string[] = JSON.parse(
      core.getInput("files", { required: true })
    );
    const prefix = core.getInput("prefix") || ""
    const payload = core.getInput("payload")

    core.info("Building worktree dependency graph");
    const graph = new YarnGraph(await listYarnWorkspaces());

    core.startGroup("Identifying directly modified workspaces");
    const changedWorkspaces = await graph.getWorkspacesForFiles(...files);
    core.endGroup();
    core.info(`Affected workspaces [${changedWorkspaces.join(", ")}]`);

    core.startGroup("Identifying dependent workspaces");
    let targetWorkspaces = graph.getRecursiveDependents(...changedWorkspaces).filter(w => w.startsWith(prefix)).map(w => w.replace(prefix, ""));
    core.endGroup();

    if (payload) {
      targetWorkspaces = JSON.parse(payload).filter((p: { package: string; }) => targetWorkspaces.includes(p.package))
    }

    core.info(`Target workspaces [${JSON.stringify(targetWorkspaces)}]`);

    core.setOutput("targets", targetWorkspaces);
  } catch (err) {
    core.setFailed(err);
  }
};

main();
