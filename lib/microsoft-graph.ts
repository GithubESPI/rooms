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
 * Fonction utilitaire pour appeler Microsoft Graph API avec gestion permanente des tokens
 */
export async function callMicrosoftGraph<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<GraphResponse<T>> {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    console.warn(
      "Aucun token d'accès disponible - session peut-être corrompue"
    );
    return {
      error: {
        status: 401,
        message: "Session non disponible - veuillez actualiser la page",
        code: "NoSession",
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

    // Si le token a expiré (401), essayer de forcer un rafraîchissement
    if (response.status === 401) {
      console.log("Token potentiellement expiré, tentative de récupération...");

      // Attendre un peu et réessayer (le callback JWT devrait rafraîchir automatiquement)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const refreshedSession = await getServerSession(authOptions);

      if (refreshedSession?.accessToken) {
        console.log("Nouvelle tentative avec session rafraîchie...");

        const retryResponse = await fetch(url, {
          ...options,
          headers: {
            Authorization: `Bearer ${refreshedSession.accessToken}`,
            "Content-Type": "application/json",
            ...options.headers,
          },
        });

        if (retryResponse.ok) {
          const data = await retryResponse.json();
          console.log(`Succès après rafraîchissement (${url})`);
          return data;
        } else {
          console.warn(
            `Échec même après rafraîchissement: ${retryResponse.status}`
          );
        }
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Pour les erreurs 401, ne pas considérer cela comme fatal
      if (response.status === 401) {
        console.warn(
          "Erreur d'authentification - session maintenue mais API inaccessible temporairement"
        );
        return {
          error: {
            status: response.status,
            message:
              "Authentification temporairement indisponible - les données seront actualisées automatiquement",
            code: "TemporaryAuthError",
          },
        };
      }

      console.error("Microsoft Graph API error:", {
        status: response.status,
        statusText: response.statusText,
        endpoint,
        error: errorData,
      });

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
 * Récupère toutes les pages d'une réponse paginée avec gestion d'erreur gracieuse
 */
export async function getAllPages<T>(
  initialUrl: string,
  options: RequestInit = {}
): Promise<T[]> {
  let url = initialUrl;
  let allItems: T[] = [];
  let retryCount = 0;
  const maxRetries = 3;

  while (url && retryCount < maxRetries) {
    console.log(
      `Récupération de la page: ${url} (tentative ${retryCount + 1})`
    );

    const response = await callMicrosoftGraph<GraphPagedResponse<T>>(
      url,
      options
    );

    // Vérifier s'il y a une erreur
    if (isGraphError(response)) {
      console.warn(`Error fetching pages from ${url}:`, response.error);

      // Si c'est une erreur temporaire, réessayer
      if (
        response.error.code === "TemporaryAuthError" &&
        retryCount < maxRetries - 1
      ) {
        retryCount++;
        await new Promise((resolve) => setTimeout(resolve, 2000 * retryCount)); // Délai progressif
        continue;
      }

      return allItems; // Retourner les éléments déjà récupérés
    }

    allItems = [...allItems, ...response.value];
    url = response["@odata.nextLink"] || "";
    retryCount = 0; // Reset retry count on success

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
