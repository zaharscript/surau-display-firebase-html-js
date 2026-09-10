import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addDoc, collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Activity {
  id?: string;
  date: string;
  timeSlot: string;
  title: string;
  speaker: string;
  notes?: string;
  is_batal?: boolean;
  createdAt?: any;
  // Malay field aliases
  tarikh?: string;
  tajuk?: string;
  penceramah?: string;
  nota?: string;
  masa?: string;
}

export function useActivities(orderDirection: "asc" | "desc" = "asc") {
  const queryClient = useQueryClient();
  const queryKey = ["activities", orderDirection];
  const queryResult = useQuery({
    queryKey,
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "activities"));
      return sortActivities(snapshot.docs.map((doc) => normalizeActivity(doc.id, doc.data())), orderDirection);
    },
    initialData: [],
  });

  useEffect(() => {
    const activitiesQuery = collection(db, "activities");
    return onSnapshot(
      activitiesQuery,
      (snapshot) => {
        queryClient.setQueryData(
          queryKey,
          sortActivities(snapshot.docs.map((doc) => normalizeActivity(doc.id, doc.data())), orderDirection),
        );
      },
      (error) => {
        console.error("Error listening to activities:", error);
        queryClient.setQueryData(queryKey, []);
      },
    );
  }, [orderDirection, queryClient]);

  return {
    ...queryResult,
    activities: queryResult.data ?? [],
  };
}

function normalizeActivity(id: string, data: Record<string, any>): Activity {
  return {
    id,
    ...data,
    date: data.tarikh || data.date || "",
    title: data.tajuk || data.title || "",
    speaker: data.penceramah || data.speaker || "",
    notes: data.nota || data.notes || "",
    timeSlot: data.masa || data.timeSlot || "",
  } as Activity;
}

function sortActivities(activities: Activity[], direction: "asc" | "desc") {
  return activities.sort((a, b) => {
    const dateCompare = (a.tarikh || a.date).localeCompare(b.tarikh || b.date);
    return direction === "asc" ? dateCompare : -dateCompare;
  });
}

export function useAddActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newActivity: Omit<Activity, "id">) => {
      const docRef = await addDoc(collection(db, "activities"), {
        ...newActivity,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return docRef.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}