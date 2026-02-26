"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { notify } from "@/lib/notifications";
import { Loader2, Save } from "lucide-react";
import { useEffect } from "react";

const settingsSchema = z.object({
  heroBannerLine1: z.string().max(100).optional(),
  heroBannerLine2: z.string().max(100).optional(),
  contactEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  storeAddress: z.string().optional(),
  facebookUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  instagramUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const settings = useQuery(api.settings.get);
  const updateSettings = useMutation(api.settings.update);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
  });

  useEffect(() => {
    if (settings) {
      reset({
        heroBannerLine1: settings.heroBannerLine1,
        heroBannerLine2: settings.heroBannerLine2,
        contactEmail: settings.contactEmail,
        contactPhone: settings.contactPhone,
        storeAddress: settings.storeAddress,
        facebookUrl: settings.facebookUrl,
        instagramUrl: settings.instagramUrl,
      });
    }
  }, [settings, reset]);

  const onSubmit = async (data: SettingsFormValues) => {
    try {
      await updateSettings(data);
      notify.success("Settings updated successfully");
    } catch (error) {
      notify.actionError("update settings", error);
    }
  };

  if (settings === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Store Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure global storefront banners, contact info, and social links.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Homepage Content */}
        <Card>
          <CardHeader>
            <CardTitle>Homepage Banners</CardTitle>
            <CardDescription>Update the text shown on the main hero banner.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field invalid={Boolean(errors.heroBannerLine1)}>
              <FieldLabel htmlFor="heroBannerLine1">Hero Banner Line 1</FieldLabel>
              <Input
                id="heroBannerLine1"
                placeholder="e.g. Elevate Your Style"
                {...register("heroBannerLine1")}
              />
              <FieldDescription>{errors.heroBannerLine1?.message}</FieldDescription>
            </Field>

            <Field invalid={Boolean(errors.heroBannerLine2)}>
              <FieldLabel htmlFor="heroBannerLine2">Hero Banner Line 2</FieldLabel>
              <Input
                id="heroBannerLine2"
                placeholder="e.g. Premium Myanmar Menswear"
                {...register("heroBannerLine2")}
              />
              <FieldDescription>{errors.heroBannerLine2?.message}</FieldDescription>
            </Field>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Public contact details for your customers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field invalid={Boolean(errors.contactEmail)}>
                <FieldLabel htmlFor="contactEmail">Contact Email</FieldLabel>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="contact@khit.com"
                  {...register("contactEmail")}
                />
                <FieldDescription>{errors.contactEmail?.message}</FieldDescription>
              </Field>

              <Field invalid={Boolean(errors.contactPhone)}>
                <FieldLabel htmlFor="contactPhone">Contact Phone</FieldLabel>
                <Input
                  id="contactPhone"
                  placeholder="+95 9..."
                  {...register("contactPhone")}
                />
                <FieldDescription>{errors.contactPhone?.message}</FieldDescription>
              </Field>
            </div>

            <Field invalid={Boolean(errors.storeAddress)}>
              <FieldLabel htmlFor="storeAddress">Store Address</FieldLabel>
              <Input
                id="storeAddress"
                placeholder="Yangon, Myanmar"
                {...register("storeAddress")}
              />
              <FieldDescription>{errors.storeAddress?.message}</FieldDescription>
            </Field>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader>
            <CardTitle>Social Media</CardTitle>
            <CardDescription>Links to your social profiles.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field invalid={Boolean(errors.facebookUrl)}>
              <FieldLabel htmlFor="facebookUrl">Facebook URL</FieldLabel>
              <Input
                id="facebookUrl"
                placeholder="https://facebook.com/..."
                {...register("facebookUrl")}
              />
              <FieldDescription>{errors.facebookUrl?.message}</FieldDescription>
            </Field>

            <Field invalid={Boolean(errors.instagramUrl)}>
              <FieldLabel htmlFor="instagramUrl">Instagram URL</FieldLabel>
              <Input
                id="instagramUrl"
                placeholder="https://instagram.com/..."
                {...register("instagramUrl")}
              />
              <FieldDescription>{errors.instagramUrl?.message}</FieldDescription>
            </Field>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
