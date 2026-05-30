package com.substrack.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ExchangeTokenResponse {
    private String accessToken;
    private String itemId;
    
}
