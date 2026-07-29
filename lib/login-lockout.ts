const STORAGE_KEY = "tanostore_login_lockout";
const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

interface LockoutState {
  attempts: number;
  lockedUntil: number; // epoch ms, 0 kalau sedang tidak dikunci
}

// Catatan: ini proteksi ringan di sisi browser (sessionStorage, bisa
// dihapus/di-bypass orang yang paham teknis). Lapisan proteksi sesungguhnya
// tetap rate limit bawaan Supabase Auth di server. Ini cuma buat mencegah
// spam klik biasa dan kasih feedback yang jelas ke user.
function readState(): LockoutState {
  if (typeof window === "undefined") return { attempts: 0, lockedUntil: 0 };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { attempts: 0, lockedUntil: 0 };
  } catch {
    return { attempts: 0, lockedUntil: 0 };
  }
}

function writeState(state: LockoutState) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Sisa detik lockout saat ini (0 kalau tidak sedang dikunci). Dipanggil saat
// halaman dibuka/refresh supaya lockout tetap konsisten walau di-reload.
export function getRemainingLockoutSeconds(): number {
  const { lockedUntil } = readState();
  const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
  return remaining > 0 ? remaining : 0;
}

// Panggil setiap login GAGAL. Balikin jumlah detik lockout kalau baru saja
// kena batas percobaan, atau 0 kalau belum kena batas.
export function registerFailedAttempt(): number {
  const state = readState();
  const attempts = state.attempts + 1;

  if (attempts >= MAX_ATTEMPTS) {
    writeState({ attempts: 0, lockedUntil: Date.now() + LOCKOUT_SECONDS * 1000 });
    return LOCKOUT_SECONDS;
  }

  writeState({ attempts, lockedUntil: 0 });
  return 0;
}

// Panggil setiap login BERHASIL, reset hitungan percobaan gagal.
export function clearFailedAttempts(): void {
  writeState({ attempts: 0, lockedUntil: 0 });
}
