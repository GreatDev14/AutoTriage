const fs = require('fs');
let code = fs.readFileSync('c:\\Users\\HP\\OneDrive\\Documents\\PROJECTS1\\AutoTriage\\js\\desktop.js', 'utf8');
const lines = code.split('\n');

const missingBlock = `        // Keep local fallback mailto trigger active as fallback
        const mailtoUrl = \`mailto:\${encodeURIComponent(targetEmail)}?subject=\${encodeURIComponent(emailSubject)}&body=\${encodeURIComponent(emailBody)}\`;
        window.open(mailtoUrl, '_blank');
        alert('🎉 Appointment Transmitted!\\n\\nAutoTriage has launched cellular SMS and secure SMTP email routing packages directly to the mechanic!');

        // Dynamic coordinate resolution and auto-launch tracking
        const trackingMode = (urgency === 'critical') ? 'to_user' : 'to_mechanic';
        
        setTimeout(() => {
          this.openMapTracker(mechName, mech.lat, mech.lng, trackingMode);
        }, 800);
      }, 3800);
    }
  },

  // -----------------------------------------
  // LIVE CHAT LOGIC
  // -----------------------------------------
  currentChatMechName: '',
  _chatUnsubscribe: null,
  
  openChatWithMechanic: function(name) {
    this.currentChatMechName = name;
    document.getElementById('chatTargetName').innerText = name;
    
    const shareBanner = document.getElementById('chatAiShareBanner');
    if (shareBanner) {
      if (this.diagnosisHistory && this.diagnosisHistory.length > 0) {
        shareBanner.style.display = 'flex';
      } else {
        shareBanner.style.display = 'none';
      }
    }

    const modal = document.getElementById('chatDrawerModal');
    const content = document.getElementById('chatDrawerContent');
    if (!modal || !content) return;
    
    modal.style.display = 'flex';
    setTimeout(() => { content.style.transform = 'translateX(0)'; }, 10);
    setTimeout(() => { document.getElementById('chatMessageInput')?.focus(); }, 300);

    // Real-time Firebase Listener
    if (this._chatUnsubscribe) {
      this._chatUnsubscribe();
    }
    
    if (typeof MechAPI !== 'undefined' && MechAPI.subscribeToChat) {
      this._chatUnsubscribe = MechAPI.subscribeToChat(name, (messages) => {
        if (!this._chatIndexMap) this._chatIndexMap = {};
        this._chatIndexMap[name] = messages;
        this.renderChatMessages();
      });
    } else {
      this.renderChatMessages(); // Fallback
    }
  },`;

lines.splice(2491, 19, missingBlock);

fs.writeFileSync('c:\\Users\\HP\\OneDrive\\Documents\\PROJECTS1\\AutoTriage\\js\\desktop.js', lines.join('\n'));
console.log('Fixed');
