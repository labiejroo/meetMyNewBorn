"use client";

import { useCallback, useMemo, useState } from "react";
import { HOLIDAYS, TODAY, addDays, formatRange, inBlackout } from "./dates";
import { SEED_BOOKINGS, SEED_TERMS } from "./seed";
import { mockApi } from "./api";
import type { Booking, FormState, ModalTarget, ResultState, Status, Term, Toast, ToastKind, WeekendInfo } from "./types";

export function useBooking() {
  const [bookings, setBookings] = useState<Record<string, Booking>>(() => ({ ...SEED_BOOKINGS }));
  const [terms, setTerms] = useState<Term[]>(() => SEED_TERMS.map((t) => ({ ...t })));
  const [admin, setAdmin] = useState(false);
  const [failMode, setFailMode] = useState(false);
  const [month, setMonth] = useState("2026-10");
  const [pick, setPick] = useState<{ sat: string; arrival: FormState["arrival"] } | null>(null);
  const [modal, setModal] = useState<ModalTarget | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<{ email?: string; guest?: string }>({});
  const [sending, setSending] = useState(false);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [pending, setPending] = useState<{ sat: string; guest: string } | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dropToast = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback((kind: ToastKind, text: string) => {
    const id = Math.random().toString(36).slice(2, 8);
    setToasts((t) => [...t, { id, kind, text }]);
    if (kind !== "error") setTimeout(() => dropToast(id), 5000);
  }, [dropToast]);

  const termAt = useCallback((day: string) => terms.find((t) => day >= t.start && day <= t.end) ?? null, [terms]);

  const weekendInfo = useCallback((sat: string): WeekendInfo => {
    const sun = addDays(sat, 1);
    if (sun < TODAY) return { status: "past" };
    const rec = bookings[sat];
    if (rec) return rec;
    if (inBlackout(sat) || inBlackout(sun)) {
      const inside = HOLIDAYS[sat] ?? HOLIDAYS[sun];
      return { status: "holiday", reason: inside ? `Przerwa świąteczna · ${inside}` : "Przerwa świąteczna" };
    }
    const h = HOLIDAYS[sat] ?? HOLIDAYS[sun];
    if (h) return { status: "holiday", reason: h };
    return { status: "free" };
  }, [bookings]);

  const openWeekend = useCallback((sat: string, day: FormState["arrival"]) => {
    const info = weekendInfo(sat);
    setPick({ sat, arrival: admin ? info.arrival ?? null : day });
    setMonth(sat.slice(0, 7));
    setErrors({});
    setDeleteArmed(false);
    setModal({ start: sat, end: addDays(sat, 1), weekend: true, sat });
    setForm({
      email: info.email ?? "",
      guest: info.guest ?? "",
      arrival: admin ? info.arrival ?? null : day,
      visible: info.visible !== false,
      status: info.status === "holiday" ? "taken" : info.status,
    });
  }, [admin, weekendInfo]);

  const openTerm = useCallback((term: Term) => {
    setPick(null);
    setErrors({});
    setDeleteArmed(false);
    setModal({ start: term.start, end: term.end, weekend: false, termId: term.id });
    setForm({
      email: term.email ?? "",
      guest: term.guest ?? "",
      arrival: term.arrival ?? null,
      visible: term.visible !== false,
      status: term.status,
    });
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
    setForm(null);
    setErrors({});
    setSending(false);
    setDeleteArmed(false);
  }, []);

  const setField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }, []);

  const validate = useCallback(() => {
    if (!form) return false;
    const next: { email?: string; guest?: string } = {};
    if (!form.email.trim()) next.email = "Podaj adres e-mail — na niego wyślemy potwierdzenie.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) next.email = "Ten adres wygląda na niepełny. Sprawdź go, prosimy.";
    if (!form.guest.trim()) next.guest = "Napisz, kto przyjedzie — rodzice chcą wiedzieć, kogo witać.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [form]);

  /** Gość wysyła prośbę → status pending, czeka na potwierdzenie gospodarzy. */
  const submit = useCallback(async () => {
    if (!modal?.sat || !form || sending || !validate()) return;
    setSending(true);
    try {
      await mockApi(failMode);
      const sat = modal.sat;
      setBookings((b) => ({
        ...b,
        [sat]: { status: "pending", guest: form.guest.trim(), email: form.email.trim(), arrival: form.arrival, visible: form.visible },
      }));
      setPending({ sat, guest: form.guest.trim() });
      setSending(false);
      setModal(null);
      setForm(null);
      setPick(null);
      toast("warn", "Prośba wysłana — dostaniesz maila, gdy gospodarze potwierdzą termin.");
    } catch {
      setSending(false);
      toast("error", "Ten termin właśnie został zajęty przez kogoś innego.");
    }
  }, [modal, form, sending, validate, failMode, toast]);

  /** Gospodarze klikają „potwierdzam” w mailu → termin zarezerwowany, gość dostaje maila. */
  const confirmPending = useCallback(() => {
    if (!pending) return;
    const sat = pending.sat;
    setBookings((b) => ({ ...b, [sat]: { ...b[sat], status: "taken" } }));
    setPending(null);
    setResult({ kind: "confirmed", sat });
    toast("ok", "Rezerwacja potwierdzona — gość dostał maila.");
  }, [pending, toast]);

  const rejectPending = useCallback(() => {
    if (!pending) return;
    const sat = pending.sat;
    setBookings((b) => {
      const next = { ...b };
      delete next[sat];
      return next;
    });
    setPending(null);
    setResult({ kind: "expired", sat });
    toast("error", "Prośba odrzucona — termin wrócił do puli.");
  }, [pending, toast]);

  const cancelConfirmed = useCallback(() => {
    const sat = result?.sat;
    if (sat) {
      setBookings((b) => {
        const next = { ...b };
        delete next[sat];
        return next;
      });
    }
    setResult({ kind: "cancelled", sat });
  }, [result]);

  const saveAdmin = useCallback(() => {
    if (!modal || !form) return;
    if (modal.weekend && modal.sat) {
      const sat = modal.sat;
      setBookings((b) => {
        const next = { ...b };
        if (form.status === "free") delete next[sat];
        else next[sat] = { ...next[sat], status: form.status, guest: form.guest.trim(), email: form.email.trim(), arrival: form.arrival, visible: form.visible };
        return next;
      });
    } else {
      setTerms((list) => list.map((t) => (t.id === modal.termId ? { ...t, status: form.status, guest: form.guest.trim(), email: form.email.trim(), arrival: form.arrival, visible: form.visible } : t)));
    }
    closeModal();
    toast("ok", "Zmiany zapisane.");
  }, [modal, form, closeModal, toast]);

  const deleteAdmin = useCallback(() => {
    if (!modal) return;
    if (!deleteArmed) { setDeleteArmed(true); return; }
    if (modal.weekend && modal.sat) {
      const sat = modal.sat;
      setBookings((b) => {
        const next = { ...b };
        delete next[sat];
        return next;
      });
    } else {
      setTerms((list) => list.filter((t) => t.id !== modal.termId));
    }
    closeModal();
    toast("ok", "Termin usunięty — weekend wrócił do puli.");
  }, [modal, deleteArmed, closeModal, toast]);

  const blockWeekend = useCallback(() => {
    if (!modal?.sat) return;
    const sat = modal.sat;
    setBookings((b) => ({ ...b, [sat]: { status: "blocked", reason: "Zablokowane przez gospodarzy" } }));
    closeModal();
    toast("ok", "Termin zablokowany.");
  }, [modal, closeModal, toast]);

  const addTerm = useCallback((start: string, end: string, guest: string, status: Status) => {
    const id = "t" + Math.random().toString(36).slice(2, 8);
    setTerms((list) => [...list, { id, start, end, status, guest: guest.trim(), email: "gospodarze@example.com", arrival: null, visible: true }]);
    setMonth(start.slice(0, 7));
    toast("ok", `Termin dodany: ${formatRange(start, end)}.`);
  }, [toast]);

  /** Lista wszystkich terminów: weekendy w oknie rezerwacji + terminy gospodarzy. */
  const allTerms = useMemo(() => {
    const out: { start: string; end: string; info: WeekendInfo; weekend: boolean; sat?: string; term?: Term }[] = [];
    let s = "2026-08-29";
    while (s <= "2027-01-30") {
      const info = weekendInfo(s);
      if (info.status !== "past") out.push({ start: s, end: addDays(s, 1), info, weekend: true, sat: s });
      s = addDays(s, 7);
    }
    terms.forEach((t) => out.push({ start: t.start, end: t.end, info: t, weekend: false, term: t }));
    return out.sort((a, b) => (a.start < b.start ? -1 : 1));
  }, [weekendInfo, terms]);

  return {
    bookings, terms, admin, setAdmin, failMode, setFailMode,
    month, setMonth, pick, modal, form, errors, sending, deleteArmed,
    pending, result, setResult, toasts, dropToast,
    weekendInfo, termAt, allTerms,
    openWeekend, openTerm, closeModal, setField, submit,
    confirmPending, rejectPending, cancelConfirmed,
    saveAdmin, deleteAdmin, blockWeekend, addTerm,
  };
}

export type Booking2 = Booking;
