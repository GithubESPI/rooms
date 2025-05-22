import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// URL de base de l'API Microsoft Graph
const GRAPH_API_BASE = "https://graph.microsoft.com/v1.0";

// Interface pour les erreurs Microsoft Graph
export interface GraphError {
  status: number;
  message: string;
  code: string;
}

// Type de retour pour les appels à Microsoft Graph
export type GraphResponse<T> = T | { error: GraphError };

/**
 * Fonction utilitaire pour appeler Microsoft Graph API
 */
export async function callMicrosoftGraph<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<GraphResponse<T>> {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return {
      error: {
        status: 401,
        message: "Not authenticated",
        code: "Unauthorized",
      },
    };
  }

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${GRAPH_API_BASE}${endpoint}`;

  try {
    console.log(`Appel à Microsoft Graph API: ${url}`);

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Microsoft Graph API error:", {
        status: response.status,
        statusText: response.statusText,
        endpoint,
        error: errorData,
      });

      // Retourner un objet d'erreur au lieu de lancer une exception
      return {
        error: {
          status: response.status,
          message: errorData.error?.message || response.statusText,
          code: errorData.error?.code || "UnknownError",
        },
      };
    }

    const data = await response.json();
    console.log(`Réponse de Microsoft Graph API (${url}):`, {
      status: response.status,
      dataSize: JSON.stringify(data).length,
      hasValue: "value" in data,
      valueLength: "value" in data ? data.value.length : "N/A",
    });

    return data;
  } catch (error) {
    console.error("Error calling Microsoft Graph API:", error);
    return {
      error: {
        status: 500,
        message: error instanceof Error ? error.message : "Unknown error",
        code: "FetchError",
      },
    };
  }
}

/**
 * Interface pour les réponses paginées de Microsoft Graph
 */
export interface GraphPagedResponse<T> {
  value: T[];
  "@odata.nextLink"?: string;
}

/**
 * Fonction utilitaire pour vérifier si une réponse contient une erreur
 */
export function isGraphError<T>(
  response: GraphResponse<T>
): response is { error: GraphError } {
  return response && typeof response === "object" && "error" in response;
}

/**
 * Récupère toutes les pages d'une réponse paginée
 */
export async function getAllPages<T>(
  initialUrl: string,
  options: RequestInit = {}
): Promise<T[]> {
  let url = initialUrl;
  let allItems: T[] = [];

  while (url) {
    console.log(`Récupération de la page: ${url}`);

    const response = await callMicrosoftGraph<GraphPagedResponse<T>>(
      url,
      options
    );

    // Vérifier s'il y a une erreur
    if (isGraphError(response)) {
      console.warn(`Error fetching pages from ${url}:`, response.error);
      return allItems; // Retourner les éléments déjà récupérés
    }

    allItems = [...allItems, ...response.value];
    url = response["@odata.nextLink"] || "";

    console.log(
      `${response.value.length} éléments récupérés, ${
        allItems.length
      } au total, nextLink: ${url ? "Oui" : "Non"}`
    );
  }

  return allItems;
}

export interface GraphRoom {
  id: string;
  displayName: string;
  building?: string;
  address?: {
    city?: string;
  };
  capacity?: number;
  audioDeviceName?: string;
  videoDeviceName?: string;
  displayDevice?: string;
  isWheelChairAccessible?: boolean;
  emailAddress?: string;
}

export interface GraphEvent {
  id: string;
  subject?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  organizer: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
  attendees?: any[];
}

export interface GraphScheduleResponse {
  value: {
    scheduleId?: string;
    availabilityView?: string;
    scheduleItems?: Array<{
      status?: string;
      subject?: string;
      start?: {
        dateTime: string;
        timeZone: string;
      };
      end?: {
        dateTime: string;
        timeZone: string;
      };
      organizer?: {
        emailAddress?: {
          name?: string;
          address?: string;
        };
      };
    }>;
  }[];
}
