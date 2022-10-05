import Package from "./Package";

type PackageSearchResponse = {
  totalHits: number;
  data: Package[];
};

export default PackageSearchResponse;
