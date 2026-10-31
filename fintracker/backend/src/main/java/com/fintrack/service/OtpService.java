package com.fintrack.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${app.otp.dev-mode:true}")
    private boolean devMode;

    @Value("${app.otp.expose-in-response:false}")
    private boolean exposeOtpInResponse;

    private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();

    private static final int OTP_LENGTH = 6;
    private static final int OTP_EXPIRY_MINUTES = 10;

    public Map<String, String> sendOtp(String email) {
        String normalizedEmail = email.toLowerCase().trim();
        String otp = generateOtp();
        otpStore.put(normalizedEmail, new OtpEntry(otp, LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES)));

        logOtpToConsole(normalizedEmail, otp);

        Map<String, String> response = new HashMap<>();
        boolean mailConfigured = isMailConfigured();

        if (mailConfigured) {
            try {
                sendOtpEmail(normalizedEmail, otp);
                response.put("message", "OTP sent successfully to " + normalizedEmail);
            } catch (Exception e) {
                log.error("Failed to send OTP email to: {}", normalizedEmail, e);
                if (devMode) {
                    response.put("message", "Email could not be sent. Use the OTP shown below or in the backend terminal.");
                    response.put("devMode", "true");
                    maybeExposeOtp(response, otp);
                } else {
                    throw new RuntimeException("Failed to send OTP email. Please try again.");
                }
            }
        } else if (devMode) {
            response.put("message", "OTP generated (development mode). Check the code below or the backend terminal.");
            response.put("devMode", "true");
            maybeExposeOtp(response, otp);
        } else {
            throw new RuntimeException(
                    "Email is not configured. Set MAIL_USERNAME and MAIL_PASSWORD, or enable app.otp.dev-mode.");
        }

        return response;
    }

    public boolean verifyOtp(String email, String otp) {
        OtpEntry entry = otpStore.get(email.toLowerCase().trim());
        if (entry == null) {
            throw new RuntimeException("No OTP found for this email. Please request a new one.");
        }
        if (entry.expiry.isBefore(LocalDateTime.now())) {
            otpStore.remove(email.toLowerCase().trim());
            throw new RuntimeException("OTP has expired. Please request a new one.");
        }
        if (!entry.otp.equals(otp)) {
            throw new RuntimeException("Invalid OTP. Please try again.");
        }
        otpStore.remove(email.toLowerCase().trim());
        return true;
    }

    private boolean isMailConfigured() {
        return fromEmail != null && !fromEmail.isBlank()
                && mailPassword != null && !mailPassword.isBlank();
    }

    private void maybeExposeOtp(Map<String, String> response, String otp) {
        if (exposeOtpInResponse) {
            response.put("otp", otp);
        }
    }

    private void logOtpToConsole(String email, String otp) {
        System.out.println("==================================================");
        System.out.println(">>> FinTrack OTP for " + email + ": " + otp + " <<<");
        System.out.println(">>> Expires in " + OTP_EXPIRY_MINUTES + " minutes <<<");
        System.out.println("==================================================");
    }

    private void sendOtpEmail(String email, String otp) throws Exception {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

        helper.setTo(email);
        helper.setSubject("FinTrack Pro - Email Verification Code: " + otp);
        helper.setFrom(fromEmail);

        String htmlContent =
                "<!DOCTYPE html><html><body style='font-family:Segoe UI,sans-serif'>" +
                "<h2>FinTrack Pro</h2>" +
                "<p>Your verification code is:</p>" +
                "<p style='font-size:32px;font-weight:bold;letter-spacing:6px;color:#1a56db'>" + otp + "</p>" +
                "<p>Expires in " + OTP_EXPIRY_MINUTES + " minutes.</p>" +
                "</body></html>";

        helper.setText(htmlContent, true);
        mailSender.send(mimeMessage);
        log.info("OTP email sent to {}", email);
    }

    private String generateOtp() {
        SecureRandom random = new SecureRandom();
        StringBuilder otp = new StringBuilder();
        for (int i = 0; i < OTP_LENGTH; i++) {
            otp.append(random.nextInt(10));
        }
        return otp.toString();
    }

    private static class OtpEntry {
        String otp;
        LocalDateTime expiry;

        OtpEntry(String otp, LocalDateTime expiry) {
            this.otp = otp;
            this.expiry = expiry;
        }
    }
}
