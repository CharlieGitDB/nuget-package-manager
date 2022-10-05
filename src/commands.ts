import { exec } from "child-process-promise";
import * as vscode from "vscode";
import { ADD_NUGET_PACKAGE, REMOVE_NUGET_PACKAGE } from "./constants";
import {
  getInstalledPackageOptions,
  getPackageId,
  getPackageOptions,
  getSelectedProjectPath,
  searchForPackage,
} from "./util";

export function registerAddPackage(): vscode.Disposable {
  return vscode.commands.registerCommand(ADD_NUGET_PACKAGE, async () => {
    const selectedProjectFilePath = await getSelectedProjectPath();

    const packageNameToSearch = await vscode.window.showInputBox({
      placeHolder: "What is the name of the package you would like to add?",
    });

    const packageSearchResponse = await searchForPackage(
      packageNameToSearch ?? ""
    );

    if (packageSearchResponse) {
      const selectedPackage = await vscode.window.showQuickPick(
        getPackageOptions(packageSearchResponse?.data)
      );

      if (selectedPackage) {
        try {
          await exec(
            `dotnet add ${selectedProjectFilePath} package ${getPackageId(
              selectedPackage
            )}`
          );
          vscode.window.showInformationMessage(
            "Successfully added package to project"
          );
        } catch (e) {
          vscode.window.showErrorMessage("Unable to add package to project");
        }
      }
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
