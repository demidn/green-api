"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAtomValue, useSetAtom } from "jotai";
import type { GreenApiConfig } from "@/domains/messaging/domain";
import { greenApiConfigAtom } from "@/domains/messaging/feature-shared";
import { Button } from "@/shared/ui/Button";
import { TextBox } from "@/shared/ui/TextBox";
import { settingsOpenAtom } from "../../store/ui.atoms";

export function GreenApiConfigForm() {
  const config = useAtomValue(greenApiConfigAtom);
  const setConfig = useSetAtom(greenApiConfigAtom);
  const setSettingsOpen = useSetAtom(settingsOpenAtom);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GreenApiConfig>({
    defaultValues: config ?? { apiUrl: "", idInstance: "", apiTokenInstance: "" },
  });

  useEffect(() => {
    reset(config ?? { apiUrl: "", idInstance: "", apiTokenInstance: "" });
  }, [config, reset]);

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={handleSubmit((values) => {
        setConfig({
          apiUrl: values.apiUrl.trim(),
          idInstance: values.idInstance.trim(),
          apiTokenInstance: values.apiTokenInstance.trim(),
        });
        setSettingsOpen(false);
      })}
    >
      <TextBox
        label="API URL"
        type="url"
        autoFocus
        autoComplete="url"
        error={errors.apiUrl?.message}
        {...register("apiUrl", {
          required: "Enter the API URL.",
          setValueAs: (value: string) => value.trim(),
          validate: (value) => {
            try {
              const url = new URL(value);
              return ["http:", "https:"].includes(url.protocol) || "Use an HTTP or HTTPS URL.";
            } catch {
              return "Enter a valid HTTP or HTTPS URL.";
            }
          },
        })}
      />
      <TextBox
        label="ID Instance"
        autoComplete="off"
        error={errors.idInstance?.message}
        {...register("idInstance", {
          required: "Enter the instance ID.",
          setValueAs: (value: string) => value.trim(),
        })}
      />
      <TextBox
        label="API Token Instance"
        type="password"
        autoComplete="off"
        error={errors.apiTokenInstance?.message}
        {...register("apiTokenInstance", {
          required: "Enter the API token.",
          setValueAs: (value: string) => value.trim(),
        })}
      />
      <Button type="submit" disabled={isSubmitting} className="w-full">
        Save and continue
      </Button>
    </form>
  );
}
