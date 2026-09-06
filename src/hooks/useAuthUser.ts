import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getFirebase } from "@/lib/firebase";

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    getFirebase()
      .then(({ auth }) => {
        unsub = onAuthStateChanged(auth, (u) => {
          setUser(u);
          setReady(true);
        });
      })
      .catch(() => setReady(true));
    return () => unsub?.();
  }, []);

  return { user, ready };
}
