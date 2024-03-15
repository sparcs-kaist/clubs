import type { Paths } from "./paths";

const headerPaths: (keyof Paths)[] = ["HOME", "CLUBS", "VOTING", "COMMUNITY"];
const footerPaths: (keyof Paths)[] = ["MADE_BY", "LICENSE", "TERMS_OF_SERVICE"];

const navPaths = {
  header: headerPaths,
  footer: footerPaths,
};

export default navPaths;
