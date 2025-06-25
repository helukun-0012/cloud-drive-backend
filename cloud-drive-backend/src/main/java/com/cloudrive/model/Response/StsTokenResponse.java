package com.cloudrive.model.Response;

public class StsTokenResponse {
    private String accessKeyId;
    private String accessKeySecret;
    private String securityToken;
    private String expiration;

    public StsTokenResponse(String accessKeyId, String accessKeySecret, String securityToken, String expiration) {
        this.accessKeyId = accessKeyId;
        this.accessKeySecret = accessKeySecret;
        this.securityToken = securityToken;
        this.expiration = expiration;
    }

    public String getAccessKeyId() { return accessKeyId; }
    public String getAccessKeySecret() { return accessKeySecret; }
    public String getSecurityToken() { return securityToken; }
    public String getExpiration() { return expiration; }
}
