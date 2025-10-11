//
//  LoginView.swift
//  ReddyFitElite
//
//  Authentication screen
//

import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var email = ""
    @State private var password = ""
    @State private var displayName = ""
    @State private var isSignUp = false

    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                colors: [
                    Color(red: 0.1, green: 0.1, blue: 0.3),
                    Color(red: 0.2, green: 0.1, blue: 0.4)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(spacing: 30) {
                Spacer()

                // Logo and title
                VStack(spacing: 10) {
                    Image(systemName: "figure.run.circle.fill")
                        .font(.system(size: 80))
                        .foregroundColor(.white)

                    Text("ReddyFit")
                        .font(.system(size: 48, weight: .bold, design: .rounded))
                        .foregroundColor(.white)

                    Text("Elite Fitness Tracking")
                        .font(.system(size: 18, weight: .medium))
                        .foregroundColor(.white.opacity(0.8))
                }

                Spacer()

                // Form
                VStack(spacing: 20) {
                    if isSignUp {
                        TextField("Display Name", text: $displayName)
                            .textFieldStyle(ReddyFitTextFieldStyle())
                            .autocapitalization(.words)
                    }

                    TextField("Email", text: $email)
                        .textFieldStyle(ReddyFitTextFieldStyle())
                        .autocapitalization(.none)
                        .keyboardType(.emailAddress)

                    SecureField("Password", text: $password)
                        .textFieldStyle(ReddyFitTextFieldStyle())

                    if let errorMessage = authViewModel.errorMessage {
                        Text(errorMessage)
                            .font(.caption)
                            .foregroundColor(.red)
                            .multilineTextAlignment(.center)
                    }

                    // Sign In / Sign Up Button
                    Button(action: {
                        Task {
                            if isSignUp {
                                await authViewModel.signUp(
                                    email: email,
                                    password: password,
                                    displayName: displayName
                                )
                            } else {
                                await authViewModel.signIn(
                                    email: email,
                                    password: password
                                )
                            }
                        }
                    }) {
                        if authViewModel.isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        } else {
                            Text(isSignUp ? "Create Account" : "Sign In")
                                .font(.headline)
                        }
                    }
                    .buttonStyle(PrimaryButtonStyle())
                    .disabled(authViewModel.isLoading)

                    // Toggle Sign Up / Sign In
                    Button(action: {
                        isSignUp.toggle()
                        authViewModel.errorMessage = nil
                    }) {
                        Text(isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up")
                            .font(.subheadline)
                            .foregroundColor(.white.opacity(0.8))
                    }
                }
                .padding(.horizontal, 40)

                Spacer()

                // Social Sign In (coming soon)
                VStack(spacing: 15) {
                    Text("Or continue with")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.6))

                    HStack(spacing: 20) {
                        Button(action: {
                            Task {
                                await authViewModel.signInWithApple()
                            }
                        }) {
                            Image(systemName: "apple.logo")
                                .font(.title2)
                                .frame(width: 60, height: 50)
                                .background(Color.white.opacity(0.1))
                                .cornerRadius(10)
                        }

                        Button(action: {
                            Task {
                                await authViewModel.signInWithGoogle()
                            }
                        }) {
                            Image(systemName: "g.circle.fill")
                                .font(.title2)
                                .frame(width: 60, height: 50)
                                .background(Color.white.opacity(0.1))
                                .cornerRadius(10)
                        }
                    }
                }
                .padding(.bottom, 40)
            }
        }
    }
}

// MARK: - Custom Text Field Style
struct ReddyFitTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .padding()
            .background(Color.white.opacity(0.1))
            .cornerRadius(10)
            .foregroundColor(.white)
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(Color.white.opacity(0.2), lineWidth: 1)
            )
    }
}

// MARK: - Primary Button Style
struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .frame(maxWidth: .infinity)
            .padding()
            .background(
                LinearGradient(
                    colors: [Color.blue, Color.purple],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .foregroundColor(.white)
            .cornerRadius(10)
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(.easeInOut(duration: 0.2), value: configuration.isPressed)
    }
}

struct LoginView_Previews: PreviewProvider {
    static var previews: some View {
        LoginView()
            .environmentObject(AuthViewModel())
    }
}
