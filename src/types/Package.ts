import Version from "./Version";

export type Package = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  "@id": string;
  id: string;
  description: string;
  summary: string;
  title: string;
  projectUrl: string;
  authors: string[];
  totalDownloads: number;
  verified: boolean;
  versions: Version[];
};

export default Package;
