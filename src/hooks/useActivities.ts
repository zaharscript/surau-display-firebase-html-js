import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, getDocs, addDoc, query, orderBy } from "firebase/firestore";
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
  const queryResult = useQuery({
    queryKey: ["activities", orderDirection],
    queryFn: async () => {
      try {
        // Sort by 'tarikh' first, then fallback to 'date' or fetch all
        const q = query(collection(db, "activities"));
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Normalize Malay fields to standard UI interface
            date: data.tarikh || data.date || "",
            title: data.tajuk || data.title || "",
            speaker: data.penceramah || data.speaker || "",
            notes: data.nota || data.notes || "",
            timeSlot: data.masa || data.timeSlot || "",
          } as Activity;
        });
      } catch (error) {
        console.error("Error fetching activities:", error);
        return [] as Activity[];
      }
    },
    initialData: [],
  });

  return {
    ...queryResult,
    activities: queryResult.data ?? [],
  };
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