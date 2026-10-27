import * as NodeServices from "@effect/platform-node/NodeServices";
import { assert, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Path from "effect/Path";

import packageJson from "../../package.json" with { type: "json" };
import {
  makePersistedServerRuntimeState,
  persistServerRuntimeState,
} from "../serverRuntimeState.ts";
import { describeServerProcess, buildTriageAgentArgs } from "./triage.ts";

it.effect("reports the version the running server recorded, not the CLI's", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const statePath = path.join(
      yield* fs.makeTempDirectoryScoped({ prefix: "t3-triage-" }),
      "server-runtime.json",
    );
    const state = yield* makePersistedServerRuntimeState({
      config: { host: undefined, devUrl: undefined },
      port: 3773,
    });
    yield* persistServerRuntimeState({ path: statePath, state });

    assert.equal(
      yield* describeServerProcess(statePath),
      `running (pid ${String(process.pid)}, http://127.0.0.1:3773, version ${packageJson.version})`,
    );
  }).pipe(Effect.provide(NodeServices.layer)),
);

it("passes the prompt positionally, after the model, for agents without a prompt flag", () => {
  assert.deepEqual(buildTriageAgentArgs({}, "triage please", "gpt-5"), [
    "--model",
    "gpt-5",
    "triage please",
  ]);
  assert.deepEqual(buildTriageAgentArgs({}, "triage please", undefined), ["triage please"]);
});

it("passes the prompt behind the flag for agents that take one", () => {
  assert.deepEqual(
    buildTriageAgentArgs({ promptFlag: "--prompt-interactive" }, "triage please", undefined),
    ["--prompt-interactive", "triage please"],
  );
  assert.deepEqual(
    buildTriageAgentArgs({ promptFlag: "--prompt-interactive" }, "triage please", "gemini-3-pro"),
    ["--model", "gemini-3-pro", "--prompt-interactive", "triage please"],
  );
});
