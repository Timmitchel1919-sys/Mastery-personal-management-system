import axe from "axe-core";

/**
 * Run axe-core against a rendered DOM subtree and fail with a readable list of violations.
 * jsdom can't evaluate colour-contrast or anything needing layout, so those rules are off;
 * this catches the structural problems that matter in component tests — missing labels,
 * bad roles, orphaned form controls, heading order, duplicate ids, ARIA misuse.
 */
export async function expectNoAxeViolations(container: HTMLElement): Promise<void> {
  const results = await axe.run(container, {
    resultTypes: ["violations"],
    rules: {
      "color-contrast": { enabled: false },
      region: { enabled: false },
    },
  });

  if (results.violations.length === 0) return;

  const report = results.violations
    .map((v) => {
      const nodes = v.nodes.map((n) => `      ${n.html}`).join("\n");
      return `  [${v.impact ?? "n/a"}] ${v.id}: ${v.help}\n    ${v.helpUrl}\n${nodes}`;
    })
    .join("\n\n");

  throw new Error(`Accessibility violations (${results.violations.length}):\n${report}`);
}
