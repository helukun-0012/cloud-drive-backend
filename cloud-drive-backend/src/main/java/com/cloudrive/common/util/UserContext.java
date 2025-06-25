package com.cloudrive.common.util;

import cn.dev33.satoken.stp.StpUtil;
import com.cloudrive.common.enums.ErrorCode;
import com.cloudrive.common.exception.BusinessException;
import com.cloudrive.model.entity.User;
import com.cloudrive.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * 用户上下文工具类，用于管理用户相关的操作
 */
@Component
public class UserContext {
    
    private static UserRepository userRepository;

    @Autowired
    public void setUserRepository(UserRepository userRepository) {
        UserContext.userRepository = userRepository;
    }

    /**
     * 获取当前登录用户的ID
     * @return 用户ID
     */
    public static Long getCurrentUserId() {
        return Long.valueOf(StpUtil.getLoginIdAsString());
    }

    /**
     * 获取当前登录用户的完整信息
     * @return 用户实体
     * @throws BusinessException 如果用户不存在
     */
    public static User getCurrentUser() {
        Long userId = getCurrentUserId();
        Optional<User> user = userRepository.findById(userId);
        ExceptionUtil.throwIfNull(user.orElse(null), ErrorCode.USER_NOT_FOUND);
        return user.get();
    }

    /**
     * 检查用户是否已登录
     * @return 是否已登录
     */
    public static boolean isLoggedIn() {
        return StpUtil.isLogin();
    }
} 