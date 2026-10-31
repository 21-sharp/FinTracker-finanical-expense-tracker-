package com.fintrack.controller;

import com.fintrack.dto.DashboardDto;
import com.fintrack.security.SecurityUtils;
import com.fintrack.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final SecurityUtils securityUtils;

    private Long getCurrentUserId() { 
        return securityUtils.getCurrentUserId(); 
    }

    @GetMapping
    public ResponseEntity<DashboardDto> getDashboard(@RequestParam(required = false) Integer year) {
        return ResponseEntity.ok(dashboardService.getDashboardData(getCurrentUserId(), year));
    }
}
