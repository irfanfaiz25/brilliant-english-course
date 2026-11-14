"use client";

import { InfoIcon, RotateCcwIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Tabs } from "radix-ui";
import { useState } from "react";
import { useForm, useWatch, type Control } from "react-hook-form";

import { FormFooter } from "@/components/admin/form-footer";
import { UnsavedChangesGuard } from "@/components/admin/unsaved-changes-guard";
import { useSaveForm } from "@/components/admin/use-save-form";
import { Button } from "@/components/ui/button";
import {
  configurableResources,
  configurableRoles,
  grantableActions,
  permissionActions,
  toggleAction,
  type ConfigurableRole,
  type PermissionAction,
  type Resource,
} from "@/lib/permissions";
import { cn } from "@/lib/utils";

import { updateRolePermissionsAction } from "../admin-actions";
import type { RolePermissionsInput } from "../schema";

type RolePermissionsFormProps = {
  /** The grants in force (normalized), one list of actions per resource and role. */
  defaultValues: RolePermissionsInput;
  /** The code defaults, for "reset to default" and the "differs" mark. */
  defaults: RolePermissionsInput;
  roleLabels: Record<ConfigurableRole, string>;
};

/** Same actions, whatever their order or a missing entry. */
const sameActions = (a: readonly string[] = [], b: readonly string[] = []) =>
  a.length === b.length && a.every((action) => b.includes(action));

const differs = (
  values: Partial<Record<Resource, PermissionAction[]>> | undefined,
  defaults: Partial<Record<Resource, PermissionAction[]>>,
) => configurableResources.some((resource) => !sameActions(values?.[resource], defaults[resource]));

/**
 * The editable permission matrix of `admin` and `editor` (ADR-036): one tab per role, a checkbox
 * per action a module has. Ticking an action ticks "Lihat" too and clearing "Lihat" clears the
 * row (`toggleAction`); the server normalizes the same way, whatever is sent.
 */
export function RolePermissionsForm({
  defaultValues,
  defaults,
  roleLabels,
}: RolePermissionsFormProps) {
  const t = useTranslations("AdminUsers");
  const [role, setRole] = useState<ConfigurableRole>("admin");
  const form = useForm<RolePermissionsInput>({ defaultValues });
  const { isDirty } = form.formState;
  const values = useWatch({ control: form.control });
  const { onSubmit, isPending } = useSaveForm(form, updateRolePermissionsAction, {
    successMessage: t("permissions.saved"),
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <UnsavedChangesGuard when={isDirty && !isPending} />
      <ul className="flex flex-col gap-2 rounded-xl bg-info-soft px-4 py-3 text-body-sm text-info-strong">
        {(["superAdminNote", "mitraNote", "fixedNote"] as const).map((note) => (
          <li key={note} className="flex items-start gap-2">
            <InfoIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
            {t(`permissions.${note}`)}
          </li>
        ))}
      </ul>

      <Tabs.Root
        value={role}
        onValueChange={(next) => setRole(next as ConfigurableRole)}
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs.List
            aria-label={t("permissions.rolesLabel")}
            className="inline-flex w-fit gap-1 rounded-xl border border-border/70 bg-background/70 p-1"
          >
            {configurableRoles.map((value) => (
              <Tabs.Trigger
                key={value}
                value={value}
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-lg px-4 text-body-sm font-semibold text-muted-foreground",
                  "transition-colors duration-(--duration-fast) hover:text-foreground",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                )}
              >
                {roleLabels[value]}
                {differs(values[value], defaults[value]) && (
                  <>
                    <span aria-hidden className="size-2 rounded-full bg-warning" />
                    <span className="sr-only">{t("permissions.changed")}</span>
                  </>
                )}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!differs(values[role], defaults[role])}
            title={t("permissions.resetHint", { role: roleLabels[role] })}
            onClick={() =>
              form.setValue(role, defaults[role], { shouldDirty: true, shouldTouch: true })
            }
          >
            <RotateCcwIcon aria-hidden />
            {t("permissions.reset")}
          </Button>
        </div>

        {configurableRoles.map((value) => (
          <Tabs.Content
            key={value}
            value={value}
            forceMount
            className="outline-none data-[state=inactive]:hidden"
          >
            <RoleGrid
              control={form.control}
              role={value}
              roleLabel={roleLabels[value]}
              form={form}
            />
          </Tabs.Content>
        ))}
      </Tabs.Root>

      <FormFooter sticky isDirty={isDirty} isPending={isPending} onReset={() => form.reset()} />
    </form>
  );
}

type RoleGridProps = {
  control: Control<RolePermissionsInput>;
  form: ReturnType<typeof useForm<RolePermissionsInput>>;
  role: ConfigurableRole;
  roleLabel: string;
};

/** One role's matrix: a table from `md`, a card per module below. */
function RoleGrid({ control, form, role, roleLabel }: RoleGridProps) {
  const t = useTranslations("AdminUsers");
  const grants = useWatch({ control, name: role }) ?? {};

  const box = (resource: Resource, action: PermissionAction, withText: boolean) => {
    if (!grantableActions(resource).includes(action)) {
      return withText ? null : (
        <span className="text-muted-foreground" title={t("permissions.unavailable")}>
          <span aria-hidden>–</span>
          <span className="sr-only">{t("permissions.unavailable")}</span>
        </span>
      );
    }
    const current = grants[resource] ?? [];
    const label = t("permissions.checkbox", {
      action: t(`matrix.actions.${action}`),
      module: t(`matrix.resources.${resource}`),
      role: roleLabel,
    });
    return (
      <label
        className={cn(
          "inline-flex cursor-pointer items-center gap-2",
          withText &&
            "rounded-full border border-border/70 bg-background px-3 py-1.5 text-body-sm has-checked:border-primary has-checked:bg-primary-soft/60",
        )}
      >
        <input
          type="checkbox"
          checked={current.includes(action)}
          onChange={(event) =>
            form.setValue(
              `${role}.${resource}`,
              toggleAction(resource, current, action, event.target.checked),
              { shouldDirty: true },
            )
          }
          aria-label={withText ? undefined : label}
          className="size-5 shrink-0 cursor-pointer accent-primary"
        />
        {withText && <span>{t(`matrix.actions.${action}`)}</span>}
      </label>
    );
  };

  const moduleName = (resource: Resource) => (
    <span className="flex flex-col gap-0.5">
      <span className="text-body-sm font-semibold text-foreground">
        {t(`matrix.resources.${resource}`)}
      </span>
      {resource === "users" && (
        <span className="text-caption text-muted-foreground">{t("permissions.usersNote")}</span>
      )}
    </span>
  );

  return (
    <>
      <table className="hidden w-full text-left md:table">
        <caption className="sr-only">
          {t("matrix.title")}: {roleLabel}
        </caption>
        <thead>
          <tr className="border-b border-border/60 text-caption font-semibold text-muted-foreground">
            <th scope="col" className="py-3 pr-4 font-semibold">
              {t("matrix.module")}
            </th>
            {permissionActions.map((action) => (
              <th key={action} scope="col" className="w-24 py-3 pr-4 text-center font-semibold">
                {t(`matrix.actions.${action}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {configurableResources.map((resource) => (
            <tr key={resource} className="align-middle">
              <th scope="row" className="py-3 pr-4 text-left font-normal">
                {moduleName(resource)}
              </th>
              {permissionActions.map((action) => (
                <td key={action} className="py-3 pr-4 text-center">
                  {box(resource, action, false)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="flex flex-col divide-y divide-border/60 md:hidden">
        {configurableResources.map((resource) => (
          <li key={resource} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
            {moduleName(resource)}
            <div
              role="group"
              aria-label={t(`matrix.resources.${resource}`)}
              className="flex flex-wrap gap-2"
            >
              {grantableActions(resource).map((action) => (
                <span key={action}>{box(resource, action, true)}</span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
