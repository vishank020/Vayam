package com.community.user;

import com.community.user.dto.UserSettingsDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class UserSettingsService {

    private final UserSettingsRepository userSettingsRepository;
    private final UserRepository userRepository;

    public UserSettingsService(UserSettingsRepository userSettingsRepository, UserRepository userRepository) {
        this.userSettingsRepository = userSettingsRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public UserSettingsDto getSettings(UUID userId) {
        UserSettings settings = getOrCreateSettings(userId);
        return mapToDto(settings);
    }

    @Transactional
    public UserSettingsDto updateSettings(UUID userId, UserSettingsDto dto) {
        UserSettings settings = getOrCreateSettings(userId);
        
        if (dto.theme() != null) settings.setTheme(dto.theme());
        if (dto.accentColor() != null) settings.setAccentColor(dto.accentColor());
        if (dto.notifyComments() != null) settings.setNotifyComments(dto.notifyComments());
        if (dto.notifyReplies() != null) settings.setNotifyReplies(dto.notifyReplies());
        if (dto.notifyMentions() != null) settings.setNotifyMentions(dto.notifyMentions());
        if (dto.notifyFollows() != null) settings.setNotifyFollows(dto.notifyFollows());
        if (dto.notifySystem() != null) settings.setNotifySystem(dto.notifySystem());
        if (dto.showEmail() != null) settings.setShowEmail(dto.showEmail());
        if (dto.showWebsite() != null) settings.setShowWebsite(dto.showWebsite());
        if (dto.showLocation() != null) settings.setShowLocation(dto.showLocation());
        if (dto.allowDiscovery() != null) settings.setAllowDiscovery(dto.allowDiscovery());
        if (dto.allowFollowRequests() != null) settings.setAllowFollowRequests(dto.allowFollowRequests());
        if (dto.anonymousBrowsing() != null) settings.setAnonymousBrowsing(dto.anonymousBrowsing());

        UserSettings saved = userSettingsRepository.save(settings);
        return mapToDto(saved);
    }

    private UserSettings getOrCreateSettings(UUID userId) {
        return userSettingsRepository.findByUserId(userId).orElseGet(() -> {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            UserSettings newSettings = new UserSettings(user);
            return userSettingsRepository.save(newSettings);
        });
    }

    private UserSettingsDto mapToDto(UserSettings settings) {
        return new UserSettingsDto(
            settings.getTheme(),
            settings.getAccentColor(),
            settings.getNotifyComments(),
            settings.getNotifyReplies(),
            settings.getNotifyMentions(),
            settings.getNotifyFollows(),
            settings.getNotifySystem(),
            settings.getShowEmail(),
            settings.getShowWebsite(),
            settings.getShowLocation(),
            settings.getAllowDiscovery(),
            settings.getAllowFollowRequests(),
            settings.getAnonymousBrowsing()
        );
    }
}
