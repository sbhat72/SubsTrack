package com.substrack.controller;

import com.substrack.dto.SubscriptionRequest;
import com.substrack.dto.SubscriptionResponse;
import com.substrack.model.User;
import com.substrack.service.SubscriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @GetMapping
    ResponseEntity<List<SubscriptionResponse>> getAll(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(subscriptionService.getAll(user));
    }

    @GetMapping("/{id}")
    ResponseEntity<SubscriptionResponse> getById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(subscriptionService.getById(id, user));
    }

    @PostMapping
    ResponseEntity<SubscriptionResponse> create(
            @Valid @RequestBody SubscriptionRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(subscriptionService.create(request, user));
    }

    @PutMapping("/{id}")
    ResponseEntity<SubscriptionResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody SubscriptionRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(subscriptionService.update(id, request, user));
    }

    @DeleteMapping("/{id}")
    ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        subscriptionService.delete(id, user);
        return ResponseEntity.noContent().build();
    }
}
