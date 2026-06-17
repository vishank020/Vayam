package com.community.user;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_settings")
public class UserSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "theme", length = 50)
    private String theme = "system";

    @Column(name = "accent_color", length = 7)
    private String accentColor = "#4a6cf7";

    @Column(name = "notify_comments")
    private Boolean notifyComments = true;

    @Column(name = "notify_replies")
    private Boolean notifyReplies = true;

    @Column(name = "notify_mentions")
    private Boolean notifyMentions = true;

    @Column(name = "notify_follows")
    private Boolean notifyFollows = true;

    @Column(name = "notify_system")
    private Boolean notifySystem = true;

    @Column(name = "show_email")
    private Boolean showEmail = false;

    @Column(name = "show_website")
    private Boolean showWebsite = true;

    @Column(name = "show_location")
    private Boolean showLocation = true;

    @Column(name = "allow_discovery")
    private Boolean allowDiscovery = true;

    @Column(name = "allow_follow_requests")
    private Boolean allowFollowRequests = true;

    @Column(name = "anonymous_browsing")
    private Boolean anonymousBrowsing = false;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public UserSettings() {}

    public UserSettings(User user) {
        this.user = user;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getTheme() { return theme; }
    public void setTheme(String theme) { this.theme = theme; }

    public String getAccentColor() { return accentColor; }
    public void setAccentColor(String accentColor) { this.accentColor = accentColor; }

    public Boolean getNotifyComments() { return notifyComments; }
    public void setNotifyComments(Boolean notifyComments) { this.notifyComments = notifyComments; }

    public Boolean getNotifyReplies() { return notifyReplies; }
    public void setNotifyReplies(Boolean notifyReplies) { this.notifyReplies = notifyReplies; }

    public Boolean getNotifyMentions() { return notifyMentions; }
    public void setNotifyMentions(Boolean notifyMentions) { this.notifyMentions = notifyMentions; }

    public Boolean getNotifyFollows() { return notifyFollows; }
    public void setNotifyFollows(Boolean notifyFollows) { this.notifyFollows = notifyFollows; }

    public Boolean getNotifySystem() { return notifySystem; }
    public void setNotifySystem(Boolean notifySystem) { this.notifySystem = notifySystem; }

    public Boolean getShowEmail() { return showEmail; }
    public void setShowEmail(Boolean showEmail) { this.showEmail = showEmail; }

    public Boolean getShowWebsite() { return showWebsite; }
    public void setShowWebsite(Boolean showWebsite) { this.showWebsite = showWebsite; }

    public Boolean getShowLocation() { return showLocation; }
    public void setShowLocation(Boolean showLocation) { this.showLocation = showLocation; }

    public Boolean getAllowDiscovery() { return allowDiscovery; }
    public void setAllowDiscovery(Boolean allowDiscovery) { this.allowDiscovery = allowDiscovery; }

    public Boolean getAllowFollowRequests() { return allowFollowRequests; }
    public void setAllowFollowRequests(Boolean allowFollowRequests) { this.allowFollowRequests = allowFollowRequests; }

    public Boolean getAnonymousBrowsing() { return anonymousBrowsing; }
    public void setAnonymousBrowsing(Boolean anonymousBrowsing) { this.anonymousBrowsing = anonymousBrowsing; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
