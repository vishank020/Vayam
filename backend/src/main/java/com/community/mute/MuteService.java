package com.community.mute;

import com.community.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class MuteService {

    private final MuteRepository muteRepository;
    private final UserRepository userRepository;

    public MuteService(MuteRepository muteRepository, UserRepository userRepository) {
        this.muteRepository = muteRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void mute(String muterIdStr, String mutedIdStr) {
        UUID muterId = UUID.fromString(muterIdStr);
        UUID mutedId = UUID.fromString(mutedIdStr);

        if (muterId.equals(mutedId)) {
            throw new IllegalArgumentException("Cannot mute yourself");
        }
        if (!userRepository.existsById(mutedId)) {
            throw new IllegalArgumentException("User not found");
        }
        if (muteRepository.existsByMuterIdAndMutedId(muterId, mutedId)) {
            return;
        }

        Mute mute = new Mute();
        mute.setMuterId(muterId);
        mute.setMutedId(mutedId);
        muteRepository.save(mute);
    }

    @Transactional
    public void unmute(String muterIdStr, String mutedIdStr) {
        UUID muterId = UUID.fromString(muterIdStr);
        UUID mutedId = UUID.fromString(mutedIdStr);
        muteRepository.deleteByMuterIdAndMutedId(muterId, mutedId);
    }

    public boolean isMuted(UUID muterId, UUID mutedId) {
        return muteRepository.existsByMuterIdAndMutedId(muterId, mutedId);
    }

    public List<UUID> getMutedUserIds(String muterIdStr) {
        return muteRepository.findMutedIdsByMuterId(UUID.fromString(muterIdStr));
    }
}
