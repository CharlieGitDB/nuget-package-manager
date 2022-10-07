import { exec } from "child-process-promise";
import * as vscode from "vscode";
import {
  ADD_NUGET_PACKAGE,
  CONTENT_MENU_ADD_NUGET_PACKAGE,
  REMOVE_NUGET_PACKAGE,
} from "./constants";
import {
  addPackage,
  getInstalledPackageOptions,
  getSelectedProjectPath,
} from "./util";

export function registerAddPackage(): vscode.Disposable {
  return vscode.commands.registerCommand(ADD_NUGET_PACKAGE, async () => {
    const selectedProjectFilePath = await getSelectedProjectPath();

    if (selectedProjectFilePath) {
      addPackage(selectedProjectFilePath);
    }
  });
}

export function registerRemovePackage(): vscode.Disposable {
  return vscode.commands.registerCommand(REMOVE_NUGET_PACKAGE, async () => {
    const selectedProjectFilePath = await getSelectedProjectPath();

    let packages;
    try {
      packages = await exec(`dotnet list ${selectedProjectFilePath} package`);
    } catch (e) {
      vscode.window.showErrorMessage(
        "Unable to get projects installed packages"
      );
      return;
    }

    if (!packages) {
      vscode.window.showErrorMessage("No packages installed in project");
      return;
    }

    const installedPackages = getInstalledPackageOptions(packages.stdout);
    const packageToRemove = await vscode.window.showQuickPick(
      installedPackages
    );

    try {
      await exec(
        `dotnet remove ${selectedProjectFilePath} package ${packageToRemove}`
      );
      vscode.window.showInformationMessage(
        `${packageToRemove} was removed from project`
      );
    } catch (e) {
      vscode.window.showErrorMessage("Unable to remove package from project");
    }
  });
}

export function registerContextMenuAddPackage(): vscode.Disposable {
  return vscode.commands.registerCommand(
    CONTENT_MENU_ADD_NUGET_PACKAGE,
    ({ path }: { path: string }) => {
      addPackage(path);
    }
  );
}
