package com.cloudrive.controller;

import cn.dev33.satoken.stp.StpUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class FileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @BeforeEach
    public void setUp() {
        // 模拟一个用户登录，userId = 1001L
        StpUtil.login(1001L);
    }

    @Test
    public void testUploadFile_withParentId() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.txt",
                "text/plain",
                "Hello, Cloud!".getBytes()
        );

        mockMvc.perform(multipart("/file") // 假设 FileController 上的 @RequestMapping("/file")
                        .file(file)
                        .param("parentId", "123")
                        .header("Authorization", StpUtil.getTokenValue())) // 携带模拟 token
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }

    @Test
    public void testUploadFile_withoutParentId() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test2.txt",
                "text/plain",
                "No parentId test".getBytes()
        );

        mockMvc.perform(multipart("/file")
                        .file(file)
                        .header("Authorization", StpUtil.getTokenValue()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }

    @Test
    public void testUploadFile_emptyFile() throws Exception {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file",
                "empty.txt",
                "text/plain",
                new byte[0]
        );

        mockMvc.perform(multipart("/file")
                        .file(emptyFile)
                        .header("Authorization", StpUtil.getTokenValue()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1)); // 假设上传空文件会返回错误码 1
    }
}
