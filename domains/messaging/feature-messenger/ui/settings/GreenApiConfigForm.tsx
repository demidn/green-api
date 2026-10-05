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
        label="URL API"
        type="url"
        autoFocus
        autoComplete="url"
        error={errors.apiUrl?.message}
        {...register("apiUrl", {
          required: "Введите URL API.",
          setValueAs: (value: string) => value.trim(),
          validate: (value) => {
            try {
              const url = new URL(value);
              return (
                ["http:", "https:"].includes(url.protocol) || "Используйте URL HTTP или HTTPS."
              );
            } catch {
              return "Введите корректный URL HTTP или HTTPS.";
            }
          },
        })}
      />
      <TextBox
        label="ID экземпляра"
        autoComplete="off"
        error={errors.idInstance?.message}
        {...register("idInstance", {
          required: "Введите ID экземпляра.",
          setValueAs: (value: string) => value.trim(),
        })}
      />
      <TextBox
        label="Токен API"
        type="password"
        autoComplete="off"
        error={errors.apiTokenInstance?.message}
        {...register("apiTokenInstance", {
          required: "Введите токен API.",
          setValueAs: (value: string) => value.trim(),
        })}
      />
      <Button type="submit" disabled={isSubmitting} className="w-full">
        Сохранить и продолжить
      </Button>
    </form>
  );
}
