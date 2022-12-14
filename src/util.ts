import { exec } from "child-process-promise";
import got from "got";
import * as vscode from "vscode";
import Package from "./types/Package";
import PackageSearchResponse from "./types/PackageSearchResponse";

export function getCleanFilePath(fp: string): string {
  const fpSplit = fp.split("/");
  return `${fpSplit[fpSplit.length - 2]}/${fpSplit[fpSplit.length - 1]}`;
}

export async function getSelectedProjectPath(): Promise<string | null> {
  const projectFiles = await vscode.workspace.findFiles("**/**.csproj");

  if (projectFiles.length <= 0) {
    return null;
  }

  const fullProjectFilePaths = projectFiles.map((pf) => pf.path);
  const quickPickItems: vscode.QuickPickItem[] = fullProjectFilePaths.map((p) => ({
    label: getCleanFilePath(p),
    detail: p
  }));
  const selectedProjectFilePath = await vscode.window.showQuickPick(quickPickItems);
  const fullSelectedProjectFilePath = fullProjectFilePaths.find((fp) => fp === selectedProjectFilePath?.detail);

  return fullSelectedProjectFilePath ?? null;
}

export async function searchForPackage(
  packageName: string
): Promise<PackageSearchResponse | null> {
  return new Promise(async (resolve) => {
    vscode.window.withProgress({
      location: vscode.ProgressLocation.Window,
      cancellable: false,
      title: 'Searching for packages..'
    }, async (progress) => {
        try {
          progress.report({ increment: 0 });

          const data = await got
            .get(
              `https://azuresearch-usnc.nuget.org/query?q=${encodeURIComponent(
                packageName
              )}`
            )
            .json();

          progress.report({ increment: 100 });
          
          if (data) {
            resolve(data as PackageSearchResponse);
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
  });
}

export function getPackageOptions(packages: Package[]): string[] {
  return packages.map((p) => `${p.id} | ${p.title}`);
}

export function getPackageId(packageOption: string): string {
  return packageOption.split(" ")[0];
}

export function getInstalledPackageOptions(shellResponse: string): string[] {
  const shellResponseSplit = shellResponse.split(">");
  const [ignore, ...rawPackages] = shellResponseSplit;
  return rawPackages.map((p) => p.split(" ")[1]);
}

export async function addPackage(
  selectedProjectFilePath: string
): Promise<void> {
  const packageNameToSearch = await vscode.window.showInputBox({
    placeHolder: "What is the name of the package you would like to add?",
  });

  if (!packageNameToSearch) {
    return;
  }

  const packageSearchResponse = await searchForPackage(
    packageNameToSearch ?? ""
  );

  if (packageSearchResponse) {
    const selectedPackage = await vscode.window.showQuickPick(
      getPackageOptions(packageSearchResponse?.data)
    );

    if (selectedPackage) {
      vscode.window.withProgress({
        location: vscode.ProgressLocation.Window,
        cancellable: false,
        title: 'Adding package..'
      }, async (progress) => {
          try {
            progress.report({ increment: 0 });

            await exec(
              `dotnet add ${selectedProjectFilePath} package ${getPackageId(
                selectedPackage
              )}`
            );

            progress.report({ increment: 100 });
            
            vscode.window.showInformationMessage(
              "Successfully added package to project"
            );
          } catch (e) {
            vscode.window.showErrorMessage("Unable to add package to project");
          }
        });
    }
  }
}