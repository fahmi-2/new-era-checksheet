// hooks/useCurrentUser.ts
"use client";

import { useEffect, useState } from "react";
import { CurrentUser } from "../types/current-user";

export default function useCurrentUser() {
    const [user, setUser] = useState<CurrentUser | null>(null);

    useEffect(() => {
        try {
            // ⚠️ SESUAIKAN dengan key localStorage yang dipakai aplikasi Anda saat login
            const stored = localStorage.getItem("user");

            if (stored) {
                setUser(JSON.parse(stored));
            }
        } catch (error) {
            console.error("Gagal membaca user login:", error);
            setUser(null);
        }
    }, []);

    return user;
}