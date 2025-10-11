//
//  APIService.swift
//  ReddyFitElite
//
//  API service layer for connecting to FastAPI backend
//

import Foundation
import Combine

// MARK: - API Configuration
struct APIConfig {
    static let baseURL = ProcessInfo.processInfo.environment["API_BASE_URL"] ?? "https://reddyfit-api.azurewebsites.net"
    static let timeout: TimeInterval = 30.0
}

// MARK: - API Error
enum APIError: Error, LocalizedError {
    case invalidURL
    case networkError(Error)
    case decodingError(Error)
    case httpError(statusCode: Int, message: String)
    case unauthorized
    case serverError
    case unknown

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .decodingError(let error):
            return "Failed to decode response: \(error.localizedDescription)"
        case .httpError(let statusCode, let message):
            return "HTTP \(statusCode): \(message)"
        case .unauthorized:
            return "Unauthorized. Please log in again."
        case .serverError:
            return "Server error. Please try again later."
        case .unknown:
            return "An unknown error occurred"
        }
    }
}

// MARK: - API Service
class APIService {
    static let shared = APIService()

    private let session: URLSession
    private var authToken: String?

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = APIConfig.timeout
        config.timeoutIntervalForResource = APIConfig.timeout
        self.session = URLSession(configuration: config)
    }

    // MARK: - Authentication
    func setAuthToken(_ token: String) {
        self.authToken = token
    }

    func clearAuthToken() {
        self.authToken = nil
    }

    // MARK: - Generic Request
    private func request<T: Decodable>(
        endpoint: String,
        method: String = "GET",
        body: Data? = nil,
        headers: [String: String]? = nil
    ) async throws -> T {
        guard let url = URL(string: "\(APIConfig.baseURL)\(endpoint)") else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.httpBody = body

        // Set headers
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let authToken = authToken {
            request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        }

        if let additionalHeaders = headers {
            for (key, value) in additionalHeaders {
                request.setValue(value, forHTTPHeaderField: key)
            }
        }

        do {
            let (data, response) = try await session.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.unknown
            }

            switch httpResponse.statusCode {
            case 200...299:
                do {
                    let decoder = JSONDecoder()
                    decoder.keyDecodingStrategy = .convertFromSnakeCase
                    decoder.dateDecodingStrategy = .iso8601
                    return try decoder.decode(T.self, from: data)
                } catch {
                    throw APIError.decodingError(error)
                }

            case 401:
                throw APIError.unauthorized

            case 400...499:
                let message = String(data: data, encoding: .utf8) ?? "Client error"
                throw APIError.httpError(statusCode: httpResponse.statusCode, message: message)

            case 500...599:
                throw APIError.serverError

            default:
                throw APIError.unknown
            }

        } catch let error as APIError {
            throw error
        } catch {
            throw APIError.networkError(error)
        }
    }

    // MARK: - Whoop Integration
    func initiateWhoopAuth(userId: String) async throws -> WhoopAuthResponse {
        struct Request: Encodable {
            let userId: String
            let redirectUri: String
        }

        let requestBody = Request(
            userId: userId,
            redirectUri: "reddyfit://whoop-callback"
        )

        let data = try JSONEncoder().encode(requestBody)

        return try await request(
            endpoint: "/api/integrations/whoop/authorize",
            method: "POST",
            body: data
        )
    }

    func handleWhoopCallback(userId: String, code: String, state: String) async throws -> WhoopTokenResponse {
        struct Request: Encodable {
            let userId: String
            let code: String
            let state: String
        }

        let requestBody = Request(userId: userId, code: code, state: state)
        let data = try JSONEncoder().encode(requestBody)

        return try await request(
            endpoint: "/api/integrations/whoop/callback",
            method: "POST",
            body: data
        )
    }

    func syncWhoopData(userId: String) async throws -> WhoopSyncResponse {
        struct Request: Encodable {
            let userId: String
        }

        let requestBody = Request(userId: userId)
        let data = try JSONEncoder().encode(requestBody)

        return try await request(
            endpoint: "/api/integrations/whoop/sync",
            method: "POST",
            body: data
        )
    }

    func getWhoopInsights(userId: String) async throws -> WhoopInsights {
        struct Request: Encodable {
            let userId: String
        }

        let requestBody = Request(userId: userId)
        let data = try JSONEncoder().encode(requestBody)

        return try await request(
            endpoint: "/api/integrations/whoop/insights",
            method: "POST",
            body: data
        )
    }

    // MARK: - Photo Steganography
    func embedWorkoutMetadata(
        userId: String,
        workoutId: String?,
        photo: Data,
        includeAchievements: Bool = true,
        includeStats: Bool = true
    ) async throws -> PhotoEmbedResponse {
        let boundary = UUID().uuidString
        var request = URLRequest(url: URL(string: "\(APIConfig.baseURL)/api/photos/embed-metadata")!)
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        if let authToken = authToken {
            request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        }

        var body = Data()

        // Add form fields
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"user_id\"\r\n\r\n".data(using: .utf8)!)
        body.append("\(userId)\r\n".data(using: .utf8)!)

        if let workoutId = workoutId {
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"workout_id\"\r\n\r\n".data(using: .utf8)!)
            body.append("\(workoutId)\r\n".data(using: .utf8)!)
        }

        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"include_achievements\"\r\n\r\n".data(using: .utf8)!)
        body.append("\(includeAchievements)\r\n".data(using: .utf8)!)

        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"include_stats\"\r\n\r\n".data(using: .utf8)!)
        body.append("\(includeStats)\r\n".data(using: .utf8)!)

        // Add photo
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"photo\"; filename=\"workout.jpg\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
        body.append(photo)
        body.append("\r\n".data(using: .utf8)!)

        body.append("--\(boundary)--\r\n".data(using: .utf8)!)

        request.httpBody = body

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw APIError.serverError
        }

        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        return try decoder.decode(PhotoEmbedResponse.self, from: data)
    }

    func extractWorkoutMetadata(photo: Data) async throws -> PhotoExtractResponse {
        let boundary = UUID().uuidString
        var request = URLRequest(url: URL(string: "\(APIConfig.baseURL)/api/photos/extract-metadata")!)
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        var body = Data()

        // Add photo
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"photo\"; filename=\"scan.jpg\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
        body.append(photo)
        body.append("\r\n".data(using: .utf8)!)

        body.append("--\(boundary)--\r\n".data(using: .utf8)!)

        request.httpBody = body

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw APIError.serverError
        }

        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        return try decoder.decode(PhotoExtractResponse.self, from: data)
    }

    // MARK: - Workouts
    func getWorkouts(userId: String, limit: Int = 20) async throws -> [Workout] {
        return try await request(
            endpoint: "/api/users/\(userId)/workouts?limit=\(limit)",
            method: "GET"
        )
    }

    func createManualWorkout(workout: Workout) async throws -> Workout {
        let encoder = JSONEncoder()
        encoder.keyEncodingStrategy = .convertToSnakeCase
        encoder.dateEncodingStrategy = .iso8601
        let data = try encoder.encode(workout)

        return try await request(
            endpoint: "/api/workouts",
            method: "POST",
            body: data
        )
    }

    // MARK: - Nutrition
    func analyzeFood(photo: Data, mealType: String) async throws -> NutritionAnalysisResponse {
        let boundary = UUID().uuidString
        var request = URLRequest(url: URL(string: "\(APIConfig.baseURL)/api/nutrition/analyze")!)
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        if let authToken = authToken {
            request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        }

        var body = Data()

        // Meal type
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"meal_type\"\r\n\r\n".data(using: .utf8)!)
        body.append("\(mealType)\r\n".data(using: .utf8)!)

        // Photo
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"photo\"; filename=\"food.jpg\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
        body.append(photo)
        body.append("\r\n".data(using: .utf8)!)

        body.append("--\(boundary)--\r\n".data(using: .utf8)!)

        request.httpBody = body

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw APIError.serverError
        }

        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        return try decoder.decode(NutritionAnalysisResponse.self, from: data)
    }
}

// MARK: - Response Models
struct WhoopAuthResponse: Codable {
    let authorizationUrl: String
    let state: String
}

struct WhoopTokenResponse: Codable {
    let success: Bool
    let message: String
    let userId: String
    let whoopUserId: String?
}

struct WhoopSyncResponse: Codable {
    let success: Bool
    let dataSynced: WhoopSyncData
    let lastSync: String
}

struct WhoopSyncData: Codable {
    let recoveryCount: Int
    let cycleCount: Int
    let workoutCount: Int
    let sleepCount: Int
}

struct PhotoEmbedResponse: Codable {
    let success: Bool
    let message: String
    let photoData: String // base64 encoded
    let metadataPreview: PhotoMetadataPreview
}

struct PhotoMetadataPreview: Codable {
    let sport: String
    let durationMinutes: Double?
    let recoveryScore: Int?
    let achievementsCount: Int
}

struct PhotoExtractResponse: Codable {
    let found: Bool
    let verified: Bool?
    let metadata: WorkoutMetadata?
    let formattedDisplay: FormattedMetadata?
    let message: String?
}

struct WorkoutMetadata: Codable {
    let reddyfitVerified: Bool
    let version: String
    let timestamp: String
    let user: UserMetadata
    let workout: WorkoutMetadataDetail
    let recovery: RecoveryMetadata?
    let achievements: [String]?
}

struct UserMetadata: Codable {
    let name: String
    let memberSince: String
    let tier: String
}

struct WorkoutMetadataDetail: Codable {
    let id: String?
    let sport: String
    let start: String?
    let end: String?
    let durationMinutes: Double?
    let score: WorkoutScore?
}

struct WorkoutScore: Codable {
    let strain: Double?
    let averageHeartRate: Int?
    let maxHeartRate: Int?
    let kilojoule: Double?
}

struct RecoveryMetadata: Codable {
    let score: Int?
    let hrvRmssdMs: Double?
    let restingHr: Int?
}

struct FormattedMetadata: Codable {
    let title: String
    let sport: String
    let duration: String
    let stats: [String: AnyCodable]
    let achievements: [String]
    let verified: Bool
    let timestamp: String
}

struct NutritionAnalysisResponse: Codable {
    let success: Bool
    let detectedFoods: [DetectedFood]
    let totalNutrition: NutritionTotals
    let confidence: Double
}

struct NutritionTotals: Codable {
    let calories: Double
    let protein: Double
    let carbs: Double
    let fat: Double
}

// Helper for dynamic JSON values
struct AnyCodable: Codable {
    let value: Any

    init(_ value: Any) {
        self.value = value
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let intValue = try? container.decode(Int.self) {
            value = intValue
        } else if let doubleValue = try? container.decode(Double.self) {
            value = doubleValue
        } else if let stringValue = try? container.decode(String.self) {
            value = stringValue
        } else if let boolValue = try? container.decode(Bool.self) {
            value = boolValue
        } else {
            value = ""
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        if let intValue = value as? Int {
            try container.encode(intValue)
        } else if let doubleValue = value as? Double {
            try container.encode(doubleValue)
        } else if let stringValue = value as? String {
            try container.encode(stringValue)
        } else if let boolValue = value as? Bool {
            try container.encode(boolValue)
        }
    }
}
