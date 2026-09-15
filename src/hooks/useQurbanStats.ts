import { useEffect, useState } from "react";
import { collection, onSnapshot, type Unsubscribe } from "firebase/firestore";
import {
  qurbanDb,
  type QurbanCycle,
  type QurbanMember,
  type QurbanSaving,
  type QurbanStats,
} from "@/lib/qurbanStats";

interface QurbanStatsState {
  stats: QurbanStats | null;
  isLoading: boolean;
  hasError: boolean;
}

const EMPTY_STATE: QurbanStatsState = {
  stats: null,
  isLoading: true,
  hasError: false,
};

function calculateStats(
  cycles: QurbanCycle[],
  members: QurbanMember[],
  savings: QurbanSaving[],
): QurbanStats {
  const activeCycle = cycles.find((cycle) => cycle.status === "open") ?? cycles[0];
  const activeMembers = members.filter(
    (member) => member.cycleId === activeCycle?.id && member.status === "active",
  );
  const activeMemberIds = new Set(activeMembers.map((member) => member.id));

  return {
    totalSavings: savings
      .filter((saving) => !saving.isVoided && activeMemberIds.has(saving.memberId))
      .reduce((total, saving) => total + saving.amount, 0),
    registeredMembers: activeMembers.length,
    committedShares: activeMembers.reduce((total, member) => total + member.portionCount, 0),
  };
}

export function useQurbanStats(): QurbanStatsState {
  const [state, setState] = useState<QurbanStatsState>(EMPTY_STATE);

  useEffect(() => {
    let cycles: QurbanCycle[] = [];
    let members: QurbanMember[] = [];
    let savings: QurbanSaving[] = [];
    let loadedSources = 0;
    let hasError = false;

    const updateState = () => {
      if (hasError) {
        setState({ stats: null, isLoading: false, hasError: true });
        return;
      }

      loadedSources += 1;
      if (loadedSources < 3) return;

      setState({
        stats: calculateStats(cycles, members, savings),
        isLoading: false,
        hasError: false,
      });
    };

    const subscribe = <T>(collectionName: string, assign: (items: T[]) => void): Unsubscribe =>
      onSnapshot(
        collection(qurbanDb, collectionName),
        (snapshot) => {
          assign(snapshot.docs.map((item) => item.data() as T));
          updateState();
        },
        () => {
          hasError = true;
          updateState();
        },
      );

    const unsubscribers = [
      subscribe<QurbanCycle>("cycles", (items) => {
        cycles = items;
      }),
      subscribe<QurbanMember>("members", (items) => {
        members = items;
      }),
      subscribe<QurbanSaving>("savings", (items) => {
        savings = items;
      }),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  return state;
}
