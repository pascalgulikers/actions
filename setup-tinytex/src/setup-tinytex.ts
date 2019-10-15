let tempDirectory = process.env["RUNNER_TEMP"] || "";

import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as io from "@actions/io";
import * as tc from "@actions/tool-cache";
import * as path from "path";
import * as fs from "fs";

const IS_WINDOWS = process.platform === "win32";
const IS_MAC = process.platform === "darwin";

if (!tempDirectory) {
  let baseLocation;
  if (IS_WINDOWS) {
    // On windows use the USERPROFILE env variable
    baseLocation = process.env["USERPROFILE"] || "C:\\";
  } else {
    if (IS_MAC) {
      baseLocation = "/Users";
    } else {
      baseLocation = "/home";
    }
  }
  tempDirectory = path.join(baseLocation, "actions", "temp");
}

async function run() {
  try {
    await getTinyTex();
  } catch (error) {
    core.setFailed(error.message);
  }
}

export async function getTinyTex() {
  if (IS_WINDOWS) {
    installTinyTexWindows();
  } else {
    installTinyTexPosix();
  }
}

async function installTinyTexPosix() {
  const fileName = "install-unx.sh";
  const downloadUrl = "https://yihui.name/gh/tinytex/tools/install-unx.sh";
  let downloadPath: string | null = null;

  downloadPath = await tc.downloadTool(downloadUrl);
  await io.mv(downloadPath, path.join(tempDirectory, fileName));

  exec.exec("sh", [path.join(tempDirectory, fileName)]);

  let binPath: string;

  // The binaries are in TinyTeX/bin/*/, where the wildcard is the
  // architecture, but we should always take the first one.
  if (IS_MAC) {
    binPath = fs.readdirSync(
      path.join(process.env["HOME"] || "/", "Library/TinyTeX/bin")
    )[1];
  } else {
    binPath = fs.readdirSync(
      path.join(process.env["HOME"] || "/", ".TinyTeX/bin")
    )[1];
  }

  console.log(binPath);

  core.addPath(binPath);
}

async function installTinyTexWindows() {
  const fileName = "install-windows.bat";
  const downloadUrl = "https://yihui.name/gh/tinytex/tools/install-windows.bat";
  let downloadPath: string | null = null;

  downloadPath = await tc.downloadTool(downloadUrl);
  await io.mv(downloadPath, path.join(tempDirectory, fileName));

  exec.exec(path.join(tempDirectory, fileName));

  core.addPath(
    path.join(process.env["APPDATA"] || "C:\\", "TinyTeX", "bin", "win32")
  );
}

run();
