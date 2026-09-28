/**
 * PLACEHOLDER TESTIMONIALS. Replace every entry with a real, client-approved quote and set
 * `placeholder: false`. While `placeholder` is true, the site shows a visible "Placeholder" label so
 * nothing can be mistaken for a real review.
 */
export interface Testimonial {
  placeholder: boolean;
  quote: string;
  name: string;
  role: string;
  company: string;
}

export const testimonials: Testimonial[] = [
  {
    placeholder: true,
    quote:
      "Placeholder testimonial. Replace with a real quote about results, for example the change in leads or ROAS after working with Jehan Nexus.",
    name: "Client name",
    role: "Role",
    company: "Company",
  },
  {
    placeholder: true,
    quote:
      "Placeholder testimonial. Replace with a real quote about the client portal, for example how approvals and live reporting saved time.",
    name: "Client name",
    role: "Role",
    company: "Company",
  },
  {
    placeholder: true,
    quote:
      "Placeholder testimonial. Replace with a real quote about the website project, for example speed, design or conversions.",
    name: "Client name",
    role: "Role",
    company: "Company",
  },
];
