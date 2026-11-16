import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const contactSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }).max(100, { message: "Name must be less than 100 characters" }),
  email: z.string().trim().email({ message: "Invalid email address" }).max(255, { message: "Email must be less than 255 characters" }),
  companyName: z.string().trim().min(1, { message: "Company name is required" }).max(100, { message: "Company name must be less than 100 characters" }),
  companyWebsite: z.string().trim().url({ message: "Invalid website URL" }).max(255, { message: "Website must be less than 255 characters" }).optional().or(z.literal('')),
  message: z.string().trim().max(1000, { message: "Message must be less than 1000 characters" }).optional().or(z.literal('')),
});

type ContactFormData = z.infer<typeof contactSchema>;

const ContactForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.functions.invoke('send-demo-request', {
        body: data,
      });

      if (error) throw error;

      toast({
        title: "Demo request sent!",
        description: "We'll get back to you within 24 hours.",
      });
      
      reset();
    } catch (error: any) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "Failed to send demo request. Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-card p-8 bg-gradient-to-br from-card to-primary/5">
      <h3 className="text-2xl font-heading font-bold mb-6 text-foreground">Request a Demo</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <Label htmlFor="name" className="text-foreground">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            {...register('name')}
            className="mt-2"
            placeholder="Your full name"
          />
          {errors.name && (
            <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email" className="text-foreground">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            className="mt-2"
            placeholder="your.email@company.com"
          />
          {errors.email && (
            <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="companyName" className="text-foreground">
            Company Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="companyName"
            {...register('companyName')}
            className="mt-2"
            placeholder="Your company name"
          />
          {errors.companyName && (
            <p className="text-sm text-destructive mt-1">{errors.companyName.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="companyWebsite" className="text-foreground">
            Company Website <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="companyWebsite"
            {...register('companyWebsite')}
            className="mt-2"
            placeholder="https://www.company.com"
          />
          {errors.companyWebsite && (
            <p className="text-sm text-destructive mt-1">{errors.companyWebsite.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="message" className="text-foreground">
            Message <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="message"
            {...register('message')}
            className="mt-2"
            placeholder="Tell us about your requirements..."
            rows={4}
          />
          {errors.message && (
            <p className="text-sm text-destructive mt-1">{errors.message.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-primary via-secondary to-primary hover:opacity-90 text-white font-semibold"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            'Request a Demo'
          )}
        </Button>
      </form>
    </div>
  );
};

export default ContactForm;
