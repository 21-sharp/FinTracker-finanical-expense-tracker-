package com.fintrack.controller;

import com.fintrack.dto.TransactionDto;
import com.fintrack.entity.Transaction;
import com.fintrack.security.SecurityUtils;
import com.fintrack.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayInputStream;
import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;
    private final SecurityUtils securityUtils;

    private Long getCurrentUserId() { 
        return securityUtils.getCurrentUserId(); 
    }

    @PostMapping
    public ResponseEntity<TransactionDto> create(@Valid @RequestBody TransactionDto dto) {
        return ResponseEntity.ok(transactionService.create(dto, getCurrentUserId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransactionDto> update(@PathVariable Long id, @Valid @RequestBody TransactionDto dto) {
        return ResponseEntity.ok(transactionService.update(id, dto, getCurrentUserId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        return ResponseEntity.badRequest().body(Map.of("message", "Transactions cannot be permanently deleted. Please edit the transaction instead."));
    }

    @DeleteMapping("/all")
    public ResponseEntity<Map<String, String>> deleteAll() {
        transactionService.deleteAll(getCurrentUserId());
        return ResponseEntity.ok(Map.of("message", "All transactions deleted successfully."));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransactionDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(transactionService.getById(id, getCurrentUserId()));
    }

    @GetMapping
    public ResponseEntity<Page<TransactionDto>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "date") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        return ResponseEntity.ok(transactionService.getAll(getCurrentUserId(), PageRequest.of(page, size, sort)));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<TransactionDto>> search(
            @RequestParam(required = false) Transaction.TransactionType type,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(transactionService.search(
                getCurrentUserId(), type, category, startDate, endDate, search,
                PageRequest.of(page, size, Sort.by("date").descending())
        ));
    }

    @GetMapping("/export/excel")
    public ResponseEntity<InputStreamResource> exportExcel() {
        ByteArrayInputStream in = transactionService.exportToExcel(getCurrentUserId());
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=transactions.xlsx");

        return ResponseEntity
                .ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(new InputStreamResource(in));
    }

    @GetMapping("/export/pdf")
    public ResponseEntity<InputStreamResource> exportPdf() {
        ByteArrayInputStream in = transactionService.exportToPdf(getCurrentUserId());
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=transactions.pdf");

        return ResponseEntity
                .ok()
                .headers(headers)
                .contentType(MediaType.APPLICATION_PDF)
                .body(new InputStreamResource(in));
    }
}
