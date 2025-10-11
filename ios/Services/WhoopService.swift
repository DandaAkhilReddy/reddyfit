//
//  WhoopService.swift
//  ReddyFitElite
//
//  Whoop integration service with OAuth and data sync
//

import Foundation
import AuthenticationServices
import Combine

@MainActor
class WhoopService: NSObject, ObservableObject {
    @Published var isConnected = false
    @Published var isLoading = false
    @Published var errorMessage: String?

    @Published var latestRecovery: WhoopRecovery?
    @Published var latestStrain: WhoopStrain?
    @Published var latestSleep: WhoopSleep?
    @Published var insights: WhoopInsights?

    private var authSession: ASWebAuthenticationSession?
    private let apiService = APIService.shared

    // MARK: - Connect Whoop
    func connectWhoop(userId: String) async {
        isLoading = true
        errorMessage = nil

        do {
            // Step 1: Get authorization URL from backend
            let authResponse = try await apiService.initiateWhoopAuth(userId: userId)

            // Step 2: Open OAuth flow in browser
            try await openAuthSession(url: authResponse.authorizationUrl, userId: userId)

        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
        }
    }

    private func openAuthSession(url: String, userId: String) async throws {
        guard let authURL = URL(string: url) else {
            throw NSError(domain: "WhoopService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])
        }

        let callbackScheme = "reddyfit"

        return try await withCheckedThrowingContinuation { continuation in
            authSession = ASWebAuthenticationSession(
                url: authURL,
                callbackURLScheme: callbackScheme
            ) { [weak self] callbackURL, error in
                guard let self = self else { return }

                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }

                guard let callbackURL = callbackURL else {
                    continuation.resume(throwing: NSError(domain: "WhoopService", code: -1, userInfo: [NSLocalizedDescriptionKey: "No callback URL"]))
                    return
                }

                Task {
                    do {
                        try await self.handleCallback(url: callbackURL, userId: userId)
                        continuation.resume()
                    } catch {
                        continuation.resume(throwing: error)
                    }
                }
            }

            authSession?.presentationContextProvider = self
            authSession?.prefersEphemeralWebBrowserSession = false
            authSession?.start()
        }
    }

    private func handleCallback(url: URL, userId: String) async throws {
        // Parse callback URL
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
              let queryItems = components.queryItems else {
            throw NSError(domain: "WhoopService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid callback URL"])
        }

        guard let code = queryItems.first(where: { $0.name == "code" })?.value,
              let state = queryItems.first(where: { $0.name == "state" })?.value else {
            throw NSError(domain: "WhoopService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Missing code or state"])
        }

        // Exchange code for token via backend
        let tokenResponse = try await apiService.handleWhoopCallback(
            userId: userId,
            code: code,
            state: state
        )

        if tokenResponse.success {
            isConnected = true
            isLoading = false

            // Sync data immediately
            await syncData(userId: userId)
        } else {
            throw NSError(domain: "WhoopService", code: -1, userInfo: [NSLocalizedDescriptionKey: tokenResponse.message])
        }
    }

    // MARK: - Sync Data
    func syncData(userId: String) async {
        isLoading = true
        errorMessage = nil

        do {
            let syncResponse = try await apiService.syncWhoopData(userId: userId)

            if syncResponse.success {
                // Fetch insights
                await fetchInsights(userId: userId)
            }

            isLoading = false
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
        }
    }

    // MARK: - Fetch Insights
    func fetchInsights(userId: String) async {
        do {
            let fetchedInsights = try await apiService.getWhoopInsights(userId: userId)
            self.insights = fetchedInsights

            // Update published properties
            if let recovery = latestRecovery {
                // Already have recovery data
            }

        } catch {
            errorMessage = error.localizedDescription
        }
    }

    // MARK: - Disconnect
    func disconnect(userId: String) async {
        // Clear Whoop data
        isConnected = false
        latestRecovery = nil
        latestStrain = nil
        latestSleep = nil
        insights = nil
    }
}

// MARK: - ASWebAuthenticationPresentationContextProviding
extension WhoopService: ASWebAuthenticationPresentationContextProviding {
    nonisolated func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        // Return the key window
        let scenes = UIApplication.shared.connectedScenes
        let windowScene = scenes.first as? UIWindowScene
        let window = windowScene?.windows.first ?? ASPresentationAnchor()
        return window
    }
}
