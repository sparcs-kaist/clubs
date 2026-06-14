import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  collectPageRoutes,
  findPageAllowlistViolations,
  parseProductionReadyPaths,
  routePathFromPageFile,
} from "./web-page-allowlist-guard.mjs";

test("fails when a page route is not classified by productionReadyPaths", () => {
  const violations = findPageAllowlistViolations({
    allowlist: {
      exact: ["/"],
      startsWith: ["/clubs"],
      exclude: ["/example"],
    },
    routes: [
      {
        filePath: "packages/web/src/app/activity-certificate/page.tsx",
        routePath: "/activity-certificate",
      },
    ],
  });

  assert.deepEqual(violations, [
    {
      filePath: "packages/web/src/app/activity-certificate/page.tsx",
      routePath: "/activity-certificate",
    },
  ]);
});

test("passes exact, prefix, and explicit exclude classifications", () => {
  const violations = findPageAllowlistViolations({
    allowlist: {
      exact: ["/", "/my"],
      startsWith: ["/clubs"],
      exclude: ["/example"],
    },
    routes: [
      { filePath: "packages/web/src/app/page.tsx", routePath: "/" },
      { filePath: "packages/web/src/app/my/page.tsx", routePath: "/my" },
      {
        filePath: "packages/web/src/app/clubs/[id]/page.tsx",
        routePath: "/clubs/[id]",
      },
      {
        filePath: "packages/web/src/app/example/page.tsx",
        routePath: "/example",
      },
    ],
  });

  assert.deepEqual(violations, []);
});

test("converts Next app page files into URL route paths", () => {
  const appDir = path.join("repo", "packages", "web", "src", "app");

  assert.equal(
    routePathFromPageFile(path.join(appDir, "page.tsx"), appDir),
    "/",
  );
  assert.equal(
    routePathFromPageFile(
      path.join(
        appDir,
        "(executive-shell)",
        "executive",
        "funding",
        "[id]",
        "page.tsx",
      ),
      appDir,
    ),
    "/executive/funding/[id]",
  );
  assert.equal(
    routePathFromPageFile(
      path.join(appDir, "@modal", "(overlay)", "notice", "page.tsx"),
      appDir,
    ),
    "/notice",
  );
});

test("collects page routes from the app directory", () => {
  const workspace = makeWorkspace();
  const appDir = path.join(workspace, "packages/web/src/app");

  writeFile(path.join(appDir, "page.tsx"), "export default function Page() {}");
  writeFile(
    path.join(appDir, "clubs/[id]/page.tsx"),
    "export default function Page() {}",
  );
  writeFile(
    path.join(appDir, "clubs/[id]/layout.tsx"),
    "export default function Layout() {}",
  );

  assert.deepEqual(collectPageRoutes({ appDir }), [
    {
      filePath: path.join(appDir, "clubs/[id]/page.tsx"),
      routePath: "/clubs/[id]",
    },
    {
      filePath: path.join(appDir, "page.tsx"),
      routePath: "/",
    },
  ]);
});

test("parses productionReadyPaths from the web paths constant", () => {
  const sourceText = `
export const productionReadyPaths: {
  exact: string[];
  startsWith: string[];
  exclude: string[];
} = {
  exact: ["/", "/my"],
  startsWith: [
    "/clubs",
    "/notice",
  ],
  exclude: ["/example"],
};
`;

  assert.deepEqual(parseProductionReadyPaths(sourceText), {
    exact: ["/", "/my"],
    startsWith: ["/clubs", "/notice"],
    exclude: ["/example"],
  });
});

function makeWorkspace() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "web-page-allowlist-guard-"));
}

function writeFile(filePath, sourceText) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, sourceText);
}
