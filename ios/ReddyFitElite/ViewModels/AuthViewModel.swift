//
//  AuthViewModel.swift
//  ReddyFitElite
//
//  Authentication state management
//

import Foundation
import FirebaseAuth
import Combine

@MainActor
class AuthViewModel: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: FirebaseAuth.User?
    @Published var errorMessage: String?
    @Published var isLoading = false

    private var handle: AuthStateDidChangeListenerHandle?

    init() {
        setupAuthListener()
    }

    deinit {
        if let handle = handle {
            Auth.auth().removeStateDidChangeListener(handle)
        }
    }

    private func setupAuthListener() {
        handle = Auth.auth().addStateDidChangeListener { [weak self] _, user in
            Task { @MainActor in
                self?.currentUser = user
                self?.isAuthenticated = user != nil

                if let user = user {
                    // Set API token
                    user.getIDToken { token, error in
                        if let token = token {
                            APIService.shared.setAuthToken(token)
                        }
                    }
                }
            }
        }
    }

    // MARK: - Sign In with Email
    func signIn(email: String, password: String) async {
        isLoading = true
        errorMessage = nil

        do {
            try await Auth.auth().signIn(withEmail: email, password: password)
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    // MARK: - Sign Up with Email
    func signUp(email: String, password: String, displayName: String) async {
        isLoading = true
        errorMessage = nil

        do {
            let result = try await Auth.auth().createUser(withEmail: email, password: password)

            // Update display name
            let changeRequest = result.user.createProfileChangeRequest()
            changeRequest.displayName = displayName
            try await changeRequest.commitChanges()

        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    // MARK: - Sign In with Apple
    func signInWithApple() async {
        // Implement Apple Sign In
        errorMessage = "Apple Sign In coming soon"
    }

    // MARK: - Sign In with Google
    func signInWithGoogle() async {
        // Implement Google Sign In
        errorMessage = "Google Sign In coming soon"
    }

    // MARK: - Sign Out
    func signOut() {
        do {
            try Auth.auth().signOut()
            APIService.shared.clearAuthToken()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    // MARK: - Reset Password
    func resetPassword(email: String) async {
        isLoading = true
        errorMessage = nil

        do {
            try await Auth.auth().sendPasswordReset(withEmail: email)
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }
}
