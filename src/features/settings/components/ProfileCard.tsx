"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Card,
  CardContent,
  FormField,
  Input,
} from "@/components/ui";
import { userProfileRepository } from "@/features/auth";
import { getFirebaseClient } from "@/lib/firebase/client";
import { normalizeError } from "@/lib/errors";
import { useAuth } from "@/providers/auth-provider";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "U";
}

/** Profile card: avatar upload + editable display name. No email — that is identity, not
 * a preference, so it is not shown or edited here. */
export function ProfileCard() {
  const t = useTranslations("settings");
  const { user, profile, refreshProfile } = useAuth();
  const fileInput = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(profile?.displayName ?? user?.displayName ?? "");
  const [savingName, setSavingName] = useState(false);
  const [savedName, setSavedName] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const uid = user.uid;
  const photo = profile?.photoURL ?? user.photoURL ?? undefined;
  const trimmed = name.trim();
  const nameDirty = trimmed.length > 0 && trimmed !== (profile?.displayName ?? "");

  const fail = (caught: unknown) => setError(normalizeError(caught).message || t("profileError"));

  async function saveName() {
    setSavingName(true);
    setSavedName(false);
    setError(null);
    try {
      await userProfileRepository.update(uid, { displayName: trimmed });
      await refreshProfile();
      setSavedName(true);
    } catch (caught) {
      fail(caught);
    } finally {
      setSavingName(false);
    }
  }

  async function onPickPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { storage } = getFirebaseClient();
      const safeName = file.name.replace(/[^\w.-]+/g, "_");
      const target = storageRef(storage, `users/${uid}/avatar/${Date.now()}-${safeName}`);
      await uploadBytes(target, file, { contentType: file.type });
      const url = await getDownloadURL(target);
      await userProfileRepository.update(uid, { photoURL: url });
      await refreshProfile();
    } catch (caught) {
      fail(caught);
    } finally {
      setUploading(false);
    }
  }

  async function removePhoto() {
    setUploading(true);
    setError(null);
    try {
      await userProfileRepository.update(uid, { photoURL: null });
      await refreshProfile();
    } catch (caught) {
      fail(caught);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <div>
          <h2 className="font-medium">{t("profile")}</h2>
          <p className="text-subtle text-xs">{t("profileHelp")}</p>
        </div>

        <FormField label={t("photo")}>
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              {photo ? <AvatarImage src={photo} alt="" /> : null}
              <AvatarFallback className="text-base">{initials(name || "U")}</AvatarFallback>
            </Avatar>
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={onPickPhoto}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={uploading}
                onClick={() => fileInput.current?.click()}
              >
                {uploading ? t("photoUploading") : t("photoChange")}
              </Button>
              {photo ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={uploading}
                  onClick={removePhoto}
                >
                  {t("photoRemove")}
                </Button>
              ) : null}
            </div>
          </div>
        </FormField>

        <FormField label={t("name")} htmlFor="settings-name">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              id="settings-name"
              value={name}
              maxLength={120}
              onChange={(event) => {
                setName(event.target.value);
                setSavedName(false);
              }}
              className="max-w-xs"
            />
            <Button
              type="button"
              size="sm"
              loading={savingName}
              disabled={!nameDirty}
              onClick={saveName}
            >
              {savedName && !nameDirty ? t("nameSaved") : t("nameSave")}
            </Button>
          </div>
        </FormField>

        {error ? <p className="text-danger text-xs">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
