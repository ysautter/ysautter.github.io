document.addEventListener('DOMContentLoaded', function() {
    const skillsData = {
        Languages: {
            color: '#2a6f97',
            subcategories: {
                'Statically Typed': ['Go', 'C#', 'Java', 'C'],
                'Dynamically Typed': ['Python', 'JavaScript', 'TypeScript', 'PHP', 'Dart', 'Bash', 'TCL'],
                'Query': ['SQL']
            }
        },
        'Web & Frameworks': {
            color: '#7c3aed',
            subcategories: {
                'Backend': ['Django', 'FastAPI', 'Express', '.NET'],
                'Frontend / Mobile': ['Flutter', 'Bootstrap', 'Tailwind', 'HTML/CSS']
            }
        },
        Security: {
            color: '#c9953c',
            subcategories: {
                'Identity & Access': ['Keycloak', 'OpenLDAP'],
                'Network': ['TLS/SSL', 'IPTables', 'Firewalls', 'Wireshark'],
                'Email': ['DKIM/SPF/DMARC']
            }
        },
        'Infrastructure & Databases': {
            color: '#16a34a',
            subcategories: {
                'OS': ['Linux', 'FreeBSD', 'Windows'],
                'Servers': ['Nginx', 'Apache', 'Docker'],
                'Data': ['PostgreSQL', 'Redis', 'RabbitMQ'],
                'Networking': ['DNS', 'SMTP/IMAP']
            }
        },
        'Tools & Workflows': {
            color: '#64748b',
            subcategories: {
                'Dev Environment': ['Git', 'GitLab CI/CD', 'Vim', 'Tmux', 'SSH'],
                'Process': ['Jira', 'Agile/Scrum'],
                'Documentation': ['LaTeX']
            }
        }
    };

    const container = document.getElementById('metro-map');
    if (!container) return;

    Object.entries(skillsData).forEach(([category, data]) => {
        const line = document.createElement('div');
        line.className = 'metro-line';

        const lineHeader = document.createElement('div');
        lineHeader.className = 'metro-line-header';

        const dot = document.createElement('span');
        dot.className = 'metro-line-dot';
        dot.style.backgroundColor = data.color;
        lineHeader.appendChild(dot);

        const lineName = document.createElement('span');
        lineName.className = 'metro-line-name';
        lineName.style.color = data.color;
        lineName.textContent = category;
        lineHeader.appendChild(lineName);

        line.appendChild(lineHeader);

        const track = document.createElement('div');
        track.className = 'metro-track';
        track.style.borderColor = data.color;

        Object.entries(data.subcategories).forEach(([subcat, skills]) => {
            const segment = document.createElement('div');
            segment.className = 'metro-segment';

            const segLabel = document.createElement('span');
            segLabel.className = 'metro-segment-label';
            segLabel.textContent = subcat;
            segment.appendChild(segLabel);

            const stops = document.createElement('div');
            stops.className = 'metro-stops';

            skills.forEach(skill => {
                const stop = document.createElement('div');
                stop.className = 'metro-stop';

                const stopDot = document.createElement('span');
                stopDot.className = 'metro-stop-dot';
                stopDot.style.backgroundColor = data.color;
                stop.appendChild(stopDot);

                const stopName = document.createElement('span');
                stopName.className = 'metro-stop-name';
                stopName.textContent = skill;
                stop.appendChild(stopName);

                stops.appendChild(stop);
            });

            segment.appendChild(stops);
            track.appendChild(segment);
        });

        line.appendChild(track);
        container.appendChild(line);
    });
});
