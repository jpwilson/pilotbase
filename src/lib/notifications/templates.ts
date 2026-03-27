import type { SuggestionType } from "@/lib/supabase/types";

export interface TemplateData {
  studentName?: string;
  prospectName?: string;
  instructorName?: string;
  aircraftName?: string;
  proposedStart?: string;
  proposedEnd?: string;
  operatorName?: string;
  locationName?: string;
  lessonName?: string;
}

const DEFAULT_TEMPLATES: Record<SuggestionType, { subject: string; body: string }> = {
  waitlist: {
    subject: "Flight Opening Available — {{operatorName}}",
    body: `Hi {{studentName}},

A flight opening has become available at {{operatorName}}.

Proposed time: {{proposedStart}} to {{proposedEnd}}
Instructor: {{instructorName}}
Aircraft: {{aircraftName}}

Please confirm your availability at your earliest convenience.

Best,
{{operatorName}} Scheduling`,
  },
  reschedule: {
    subject: "Reschedule Options — {{operatorName}}",
    body: `Hi {{studentName}},

Your scheduled flight has been cancelled. We've found alternative options for you:

Proposed time: {{proposedStart}} to {{proposedEnd}}
Instructor: {{instructorName}}
Aircraft: {{aircraftName}}

Please let us know if this works or if you'd like to see other options.

Best,
{{operatorName}} Scheduling`,
  },
  discovery: {
    subject: "Discovery Flight Confirmation — {{operatorName}}",
    body: `Hi {{prospectName}},

We're excited to schedule your discovery flight at {{operatorName}}!

Date/Time: {{proposedStart}} to {{proposedEnd}}
Instructor: {{instructorName}}
Aircraft: {{aircraftName}}
Location: {{locationName}}

Please arrive 15 minutes early for your pre-flight briefing.

Best,
{{operatorName}} Scheduling`,
  },
  next_lesson: {
    subject: "Next Lesson Scheduled — {{operatorName}}",
    body: `Hi {{studentName}},

Your next lesson ({{lessonName}}) has been scheduled:

Date/Time: {{proposedStart}} to {{proposedEnd}}
Instructor: {{instructorName}}
Aircraft: {{aircraftName}}

See you at the airport!

Best,
{{operatorName}} Scheduling`,
  },
};

export function renderTemplate(
  type: SuggestionType,
  data: TemplateData,
  customTemplates?: Record<string, { subject?: string; body: string }>
): { subject: string; body: string } {
  const template = customTemplates?.[type] ?? DEFAULT_TEMPLATES[type];

  return {
    subject: interpolate(template.subject ?? "", data),
    body: interpolate(template.body, data),
  };
}

function interpolate(template: string, data: TemplateData): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return (data as Record<string, string | undefined>)[key] ?? "";
  });
}
