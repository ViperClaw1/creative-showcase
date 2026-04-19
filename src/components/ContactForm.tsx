import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Name is required" })
    .max(100, { message: "Name must be less than 100 characters" }),
  email: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email" })
    .max(255, { message: "Email must be less than 255 characters" }),
  message: z
    .string()
    .trim()
    .min(1, { message: "Message is required" })
    .max(1000, { message: "Message must be less than 1000 characters" }),
});

type ContactValues = z.infer<typeof contactSchema>;
type FieldErrors = Partial<Record<keyof ContactValues, string>>;

export const ContactForm = () => {
  const { toast } = useToast();
  const [values, setValues] = useState<ContactValues>({
    name: "",
    email: "",
    message: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof ContactValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = contactSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof ContactValues;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    // Placeholder — wire up to backend in later phase.
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);

    toast({
      title: "Message sent",
      description: "Thanks for reaching out — I'll get back to you soon.",
    });
    setValues({ name: "", email: "", message: "" });
  };

  return (
    <section id="contact" className="w-full px-4 py-16 md:py-24 bg-primary-foreground">
      <div className="max-w-xl mx-auto">
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-3">
          Get in touch
        </h2>
        <h3 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-2">
          Let's build something together
        </h3>
        <p className="text-muted-foreground mb-8">
          Have a project in mind or just want to say hi? Drop a message.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={values.name}
              onChange={(e) => update("name", e.target.value)}
              maxLength={100}
              aria-invalid={!!errors.name}
              placeholder="Your name"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={values.email}
              onChange={(e) => update("email", e.target.value)}
              maxLength={255}
              aria-invalid={!!errors.email}
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={values.message}
              onChange={(e) => update("message", e.target.value)}
              maxLength={1000}
              rows={5}
              aria-invalid={!!errors.message}
              placeholder="Tell me about your project..."
            />
            {errors.message && (
              <p className="text-sm text-destructive">{errors.message}</p>
            )}
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Sending..." : "Send message"}
          </Button>
        </form>
      </div>
    </section>
  );
};
