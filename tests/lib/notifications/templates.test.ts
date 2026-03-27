import { describe, it, expect } from "vitest";
import { renderTemplate } from "@/lib/notifications/templates";

describe("renderTemplate", () => {
  it("renders waitlist template with data", () => {
    const result = renderTemplate("waitlist", {
      studentName: "John Doe",
      operatorName: "SkyHigh Aviation",
      proposedStart: "Oct 15, 2025 2:00 PM",
      proposedEnd: "Oct 15, 2025 4:00 PM",
      instructorName: "Mike Smith",
      aircraftName: "N12345",
    });

    expect(result.subject).toContain("SkyHigh Aviation");
    expect(result.body).toContain("John Doe");
    expect(result.body).toContain("Oct 15, 2025 2:00 PM");
    expect(result.body).toContain("Mike Smith");
    expect(result.body).toContain("N12345");
  });

  it("renders discovery template", () => {
    const result = renderTemplate("discovery", {
      prospectName: "New Student",
      operatorName: "Flight Academy",
      locationName: "KJFK",
    });

    expect(result.subject).toContain("Discovery Flight");
    expect(result.body).toContain("New Student");
    expect(result.body).toContain("KJFK");
  });

  it("uses custom templates when provided", () => {
    const result = renderTemplate(
      "waitlist",
      { studentName: "Jane" },
      {
        waitlist: {
          subject: "Custom: {{studentName}}",
          body: "Hey {{studentName}}, you're up!",
        },
      }
    );

    expect(result.subject).toBe("Custom: Jane");
    expect(result.body).toBe("Hey Jane, you're up!");
  });

  it("replaces missing variables with empty string", () => {
    const result = renderTemplate("waitlist", {});
    expect(result.body).not.toContain("{{");
  });
});
