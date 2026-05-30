package com.substrack.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ExchangeTokenRequest {
    @NotNull
    private String publicToken;
}
