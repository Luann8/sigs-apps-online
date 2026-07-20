#!/usr/bin/env python3
import os
import re
import subprocess
import json
import sys

# Workspace and Vault settings
WORKSPACE_DIR = "/home/luann8/GitHub/sigs-app"
VAULT_DIR = "/home/luann8/Documentos/Obsidian Vault/SIGS-App"

def get_rel_path(abs_path):
    return os.path.relpath(abs_path, WORKSPACE_DIR)

def get_note_name(path):
    basename = os.path.basename(path)
    name, ext = os.path.splitext(basename)
    if ext == '.json':
        return name + "Config"
    return name

def get_category(rel_path):
    parts = rel_path.split(os.sep)
    if len(parts) > 1 and parts[0] == 'src':
        return parts[1].capitalize()
    return "Root"

def scan_files():
    files = []
    for root, dirs, filenames in os.walk(WORKSPACE_DIR):
        # Exclude common non-source directories
        dirs[:] = [d for d in dirs if d not in ['.git', '.expo', 'node_modules', '.gemini', 'assets', 'docs', 'scripts']]
        for f in filenames:
            ext = os.path.splitext(f)[1]
            if ext in ['.js', '.jsx', '.ts', '.tsx', '.json', '.md']:
                files.append(os.path.abspath(os.path.join(root, f)))
    return files

def resolve_import(current_file_path, import_path):
    if not import_path.startswith('.'):
        return None
    dir_name = os.path.dirname(current_file_path)
    resolved = os.path.abspath(os.path.join(dir_name, import_path))
    
    # Try different extensions
    for ext in ['', '.js', '.jsx', '.ts', '.tsx', '.json', '/index.js']:
        test_path = resolved + ext
        if os.path.exists(test_path) and os.path.isfile(test_path):
            return test_path
    return None

def parse_imports(file_path):
    if not file_path.endswith(('.js', '.jsx', '.ts', '.tsx')):
        return []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return []
        
    # Matches ES6 imports and require calls
    imports = re.findall(r'(?:import|from|require\()\s*[\'"](\.[^\'"]+)[\'"]', content)
    resolved_imports = []
    for imp in imports:
        resolved = resolve_import(file_path, imp)
        if resolved:
            resolved_imports.append(resolved)
    return list(set(resolved_imports))

def get_git_commits():
    try:
        output = subprocess.check_output(
            ["git", "log", "-n", "15", '--pretty=format:%H|%h|%an|%ar|%s'],
            cwd=WORKSPACE_DIR,
            text=True
        )
        commits = []
        for line in output.split('\n'):
            if not line.strip():
                continue
            parts = line.split('|', 4)
            if len(parts) == 5:
                full_hash, short_hash, author, date_str, msg = parts
                # Get files modified in this commit
                files_output = subprocess.check_output(
                    ["git", "show", "--name-only", "--pretty=format:", full_hash],
                    cwd=WORKSPACE_DIR,
                    text=True
                )
                modified_files = []
                for f in files_output.split('\n'):
                    f = f.strip()
                    if f:
                        abs_path = os.path.abspath(os.path.join(WORKSPACE_DIR, f))
                        # Only include files that exist and are within workspace source limits
                        if os.path.exists(abs_path) and os.path.isfile(abs_path):
                            modified_files.append(abs_path)
                commits.append({
                    'hash': full_hash,
                    'short_hash': short_hash,
                    'author': author,
                    'date': date_str,
                    'message': msg,
                    'files': modified_files
                })
        return commits
    except Exception as e:
        print(f"Warning: could not retrieve git history: {e}")
        return []

def get_working_changes():
    try:
        output = subprocess.check_output(
            ["git", "status", "--porcelain"],
            cwd=WORKSPACE_DIR,
            text=True
        )
        files = []
        for line in output.split('\n'):
            if not line.strip():
                continue
            status = line[:2].strip()
            f_path = line[3:].strip()
            if " -> " in f_path:
                f_path = f_path.split(" -> ")[1].strip()
            abs_path = os.path.abspath(os.path.join(WORKSPACE_DIR, f_path))
            if os.path.exists(abs_path) and os.path.isfile(abs_path):
                files.append((abs_path, status))
        return files
    except Exception as e:
        print(f"Warning: could not retrieve working changes status: {e}")
        return []

def generate_vault_notes(files, dependencies, dependents, commits, working_changes):
    os.makedirs(VAULT_DIR, exist_ok=True)
    print(f"Generating Obsidian Markdown notes in: {VAULT_DIR}...")
    
    # 1. Generate category containers
    categories = {}
    for f in files:
        rel = get_rel_path(f)
        cat = get_category(rel)
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(f)
        
    for cat, cat_files in categories.items():
        cat_file_path = os.path.join(VAULT_DIR, f"{cat}.md")
        with open(cat_file_path, 'w', encoding='utf-8') as cf:
            cf.write(f"# Category: {cat}\n\n")
            cf.write(f"This note groups all files under the `{cat.lower()}` segment.\n\n")
            cf.write("## Connected Files\n")
            for f in cat_files:
                cf.write(f"- [[{get_note_name(f)}]]\n")
    
    # 2. Generate working directory changes note
    wc_file_path = os.path.join(VAULT_DIR, "Working Directory Changes.md")
    with open(wc_file_path, 'w', encoding='utf-8') as wcf:
        wcf.write("# Working Directory Changes\n\n")
        wcf.write("These are the currently uncommitted modifications in the codebase.\n\n")
        wcf.write("## Modified Files\n")
        if working_changes:
            for path, status in working_changes:
                wcf.write(f"- [[{get_note_name(path)}]] (Status: `{status}`)\n")
        else:
            wcf.write("*No modified files currently in working directory.*\n")
            
    # 3. Generate commit notes
    for c in commits:
        c_file_path = os.path.join(VAULT_DIR, f"Commit-{c['short_hash']}.md")
        with open(c_file_path, 'w', encoding='utf-8') as cf:
            cf.write(f"# Commit {c['short_hash']}\n\n")
            cf.write(f"- **Author**: {c['author']}\n")
            cf.write(f"- **Date**: {c['date']}\n")
            cf.write(f"- **Message**: {c['message']}\n")
            cf.write(f"- **Full Hash**: `{c['hash']}`\n\n")
            cf.write("## Modified Files\n")
            for f in c['files']:
                cf.write(f"- [[{get_note_name(f)}]]\n")

    # 4. Generate individual file notes
    for f in files:
        note_name = get_note_name(f)
        rel = get_rel_path(f)
        cat = get_category(rel)
        f_file_path = os.path.join(VAULT_DIR, f"{note_name}.md")
        
        # Read a snippet of the file to show size and type
        size_bytes = os.path.getsize(f)
        line_count = 0
        try:
            with open(f, 'r', encoding='utf-8') as fr:
                line_count = len(fr.readlines())
        except Exception:
            pass
            
        with open(f_file_path, 'w', encoding='utf-8') as n_file:
            n_file.write(f"# {note_name}\n\n")
            n_file.write(f"- **Relative Path**: `{rel}`\n")
            n_file.write(f"- **Size**: {size_bytes} bytes ({line_count} lines)\n")
            n_file.write(f"- **Category**: [[{cat}]]\n\n")
            
            n_file.write("## Outgoing Dependencies (Imports)\n")
            deps = dependencies.get(f, [])
            if deps:
                for dep in deps:
                    n_file.write(f"- [[{get_note_name(dep)}]]\n")
            else:
                n_file.write("*None*\n")
                
            n_file.write("\n## Incoming Dependents (Imported By)\n")
            deps_in = dependents.get(f, [])
            if deps_in:
                for dep in deps_in:
                    n_file.write(f"- [[{get_note_name(dep)}]]\n")
            else:
                n_file.write("*None*\n")
                
            # Connect to commits that modified this file
            f_commits = [c for c in commits if f in c['files']]
            n_file.write("\n## Git Commit History\n")
            if f_commits:
                for c in f_commits:
                    n_file.write(f"- [[Commit-{c['short_hash']}]] - {c['message']} ({c['date']})\n")
            else:
                n_file.write("*No recent commits recorded*\n")
                
            # Connect if actively modified
            active_mod = [status for path, status in working_changes if path == f]
            if active_mod:
                n_file.write(f"\n## Active Changes\n")
                n_file.write(f"- Currently modified in [[Working Directory Changes]] with status `{active_mod[0]}`\n")

    # 5. Generate main Index note
    index_file_path = os.path.join(VAULT_DIR, "SIGS App.md")
    with open(index_file_path, 'w', encoding='utf-8') as idx:
        idx.write("# SIGS App - Neural Knowledge Map\n\n")
        idx.write("This is the main entry point note mapping the codebase design for **SIGS (Gestão Sanitária Digital)**.\n\n")
        idx.write("## 🗂️ Categories\n")
        for cat in sorted(categories.keys()):
            idx.write(f"- [[{cat}]]\n")
            
        idx.write("\n## ⚡ Active Changes\n")
        idx.write("- [[Working Directory Changes]]\n")
        
        idx.write("\n## 📅 Recent Git Commits\n")
        for c in commits[:8]:
            idx.write(f"- [[Commit-{c['short_hash']}]] - {c['message']} ({c['date']})\n")
            
    print("Obsidian notes successfully generated.")

def generate_canvas(files, dependencies, commits, working_changes):
    print("Generating native Obsidian Canvas diagram...")
    
    # Map node types/categories to X positions in columns
    col_x = {
        'index': 0,
        'working_changes': 0,
        'commit': 400,
        'screen': 800,
        'component': 1200,
        'store': 1600,
        'database': 2000,
        'theme': 2000,
        'root': 2000,
        'utils': 2400
    }
    
    # Preset colors: "1" (red), "2" (orange), "3" (yellow), "4" (green), "5" (cyan), "6" (purple)
    type_colors = {
        'index': "3",
        'working_changes': "2",
        'commit': "1",
        'screen': "4",
        'component': "5",
        'store': "6",
        'database': "6",
        'theme': "6",
        'root': "2",
        'utils': "2"
    }
    
    canvas_nodes = []
    canvas_edges = []
    
    # Store position data to establish clean connections
    node_positions = {}
    
    # Track Y offsets for each column
    col_y_counter = {}
    for col in col_x:
        col_y_counter[col] = 0
        
    def add_canvas_node(node_id, node_type, file_rel_vault_path):
        x = col_x.get(node_type, 2000)
        y = col_y_counter.get(node_type, 0) * 180
        col_y_counter[node_type] = col_y_counter.get(node_type, 0) + 1
        
        node_width = 250
        node_height = 120
        
        canvas_nodes.append({
            "id": node_id,
            "type": "file",
            "file": file_rel_vault_path,
            "x": x,
            "y": y,
            "width": node_width,
            "height": node_height,
            "color": type_colors.get(node_type, "2")
        })
        node_positions[node_id] = (x, y, node_width, node_height)

    # 1. Add Index node
    add_canvas_node("index", "index", "SIGS-App/SIGS App.md")
    
    # 2. Add Working Changes node
    add_canvas_node("working_changes", "working_changes", "SIGS-App/Working Directory Changes.md")
    
    # Link index to working changes
    canvas_edges.append({
        "id": "edge_index_wc",
        "fromNode": "index",
        "fromSide": "bottom",
        "toNode": "working_changes",
        "toSide": "top"
    })
    
    # 3. Add commits nodes
    commit_ids = {}
    for i, c in enumerate(commits):
        c_id = f"commit_{c['short_hash']}"
        commit_ids[c['hash']] = c_id
        add_canvas_node(c_id, "commit", f"SIGS-App/Commit-{c['short_hash']}.md")
        
        # Link index to commits
        if i < 4:
            canvas_edges.append({
                "id": f"edge_index_commit_{c['short_hash']}",
                "fromNode": "index",
                "fromSide": "right",
                "toNode": c_id,
                "toSide": "left"
            })
            
    # 4. Add file nodes
    file_ids = {}
    for f in files:
        rel = get_rel_path(f)
        cat = get_category(rel)
        node_type = cat.lower()
        note_name = get_note_name(f)
        node_id = f"file_{note_name}"
        file_ids[f] = node_id
        
        add_canvas_node(node_id, node_type, f"SIGS-App/{note_name}.md")
        
    # 5. Add dependency links
    edge_idx = 0
    for source, targets in dependencies.items():
        src_id = file_ids.get(source)
        if not src_id:
            continue
        for target in targets:
            tgt_id = file_ids.get(target)
            if not tgt_id:
                continue
            
            src_pos = node_positions[src_id]
            tgt_pos = node_positions[tgt_id]
            
            # Decide edge connection sides based on column coordinates
            if src_pos[0] < tgt_pos[0]:
                from_side, to_side = "right", "left"
            elif src_pos[0] > tgt_pos[0]:
                from_side, to_side = "left", "right"
            else:
                if src_pos[1] < tgt_pos[1]:
                    from_side, to_side = "bottom", "top"
                else:
                    from_side, to_side = "top", "bottom"
                    
            canvas_edges.append({
                "id": f"edge_dep_{edge_idx}",
                "fromNode": src_id,
                "fromSide": from_side,
                "toNode": tgt_id,
                "toSide": to_side
            })
            edge_idx += 1
            
    # 6. Add working changes links
    wc_idx = 0
    for path, status in working_changes:
        tgt_id = file_ids.get(path)
        if tgt_id:
            canvas_edges.append({
                "id": f"edge_wc_{wc_idx}",
                "fromNode": "working_changes",
                "fromSide": "right",
                "toNode": tgt_id,
                "toSide": "left"
            })
            wc_idx += 1
            
    # 7. Add commit modification links
    commit_edge_idx = 0
    for c in commits:
        c_id = commit_ids.get(c['hash'])
        if not c_id:
            continue
        for f in c['files']:
            tgt_id = file_ids.get(f)
            if tgt_id:
                canvas_edges.append({
                    "id": f"edge_commit_file_{commit_edge_idx}",
                    "fromNode": c_id,
                    "fromSide": "right",
                    "toNode": tgt_id,
                    "toSide": "left"
                })
                commit_edge_idx += 1
                
    # Compile JSON Canvas content
    canvas_data = {
        "nodes": canvas_nodes,
        "edges": canvas_edges
    }
    
    canvas_path = os.path.join(VAULT_DIR, "SIGS Flow.canvas")
    try:
        with open(canvas_path, 'w', encoding='utf-8') as cf:
            json.dump(canvas_data, cf, indent=2)
        print(f"Canvas successfully compiled at: {canvas_path}")
    except Exception as e:
        print(f"Error compiling canvas: {e}")

def generate_workflow_canvas(files):
    print("Generating native Obsidian Workflow Canvas diagram...")
    
    # Preset colors: "1" (red), "2" (orange), "3" (yellow), "4" (green), "5" (cyan), "6" (purple)
    nodes = [
        # Title and intro
        {
            "id": "title_card",
            "type": "text",
            "text": "# SIGS App - Operational & Technical Workflow\nThis canvas illustrates the user lifecycle, screen navigation flows, and background database sync routines in the **SIGS** application.",
            "x": 400,
            "y": -200,
            "width": 600,
            "height": 130,
            "color": "4" # Green
        },
        # Setup Column (x = 0)
        {
            "id": "wf_onboarding",
            "type": "file",
            "file": "SIGS-App/OnboardingTour.md",
            "x": 0,
            "y": 100,
            "width": 250,
            "height": 120,
            "color": "3" # Yellow
        },
        {
            "id": "wf_config",
            "type": "file",
            "file": "SIGS-App/ConfiguracoesScreen.md",
            "x": 0,
            "y": 300,
            "width": 250,
            "height": 120,
            "color": "2" # Orange
        },
        # View Column (x = 400)
        {
            "id": "wf_dashboard",
            "type": "file",
            "file": "SIGS-App/DashboardScreen.md",
            "x": 400,
            "y": 100,
            "width": 250,
            "height": 120,
            "color": "4" # Green
        },
        {
            "id": "wf_calendario",
            "type": "file",
            "file": "SIGS-App/CalendarioScreen.md",
            "x": 400,
            "y": 300,
            "width": 250,
            "height": 120,
            "color": "4" # Green
        },
        # Operations Column (x = 800)
        {
            "id": "wf_cadastro",
            "type": "file",
            "file": "SIGS-App/CadastroScreen.md",
            "x": 800,
            "y": 100,
            "width": 250,
            "height": 120,
            "color": "4" # Green
        },
        {
            "id": "wf_licencas",
            "type": "file",
            "file": "SIGS-App/LicencasScreen.md",
            "x": 800,
            "y": 300,
            "width": 250,
            "height": 120,
            "color": "4" # Green
        },
        {
            "id": "wf_estabs",
            "type": "file",
            "file": "SIGS-App/EstabelecimentosScreen.md",
            "x": 800,
            "y": 500,
            "width": 250,
            "height": 120,
            "color": "4" # Green
        },
        # Backend Columns (x = 1200)
        {
            "id": "wf_database",
            "type": "file",
            "file": "SIGS-App/database.md",
            "x": 1200,
            "y": 100,
            "width": 250,
            "height": 120,
            "color": "6" # Purple
        },
        {
            "id": "wf_licstore",
            "type": "file",
            "file": "SIGS-App/licencasStore.md",
            "x": 1200,
            "y": 300,
            "width": 250,
            "height": 120,
            "color": "6" # Purple
        },
        # Alerts Column (x = 1600)
        {
            "id": "wf_notifications",
            "type": "file",
            "file": "SIGS-App/notifications.md",
            "x": 1600,
            "y": 100,
            "width": 250,
            "height": 120,
            "color": "2" # Orange
        },
        {
            "id": "wf_alertshelper",
            "type": "file",
            "file": "SIGS-App/alertsHelper.md",
            "x": 1600,
            "y": 300,
            "width": 250,
            "height": 120,
            "color": "2" # Orange
        },
        {
            "id": "wf_alertsstore",
            "type": "file",
            "file": "SIGS-App/alertsStore.md",
            "x": 1600,
            "y": 500,
            "width": 250,
            "height": 120,
            "color": "6" # Purple
        },
        # Review & Edit Column (x = 2000)
        {
            "id": "wf_detalhe",
            "type": "file",
            "file": "SIGS-App/DetalheLicencaScreen.md",
            "x": 2000,
            "y": 100,
            "width": 250,
            "height": 120,
            "color": "4" # Green
        },
        {
            "id": "wf_inspecoes",
            "type": "file",
            "file": "SIGS-App/InspecoesScreen.md",
            "x": 2000,
            "y": 300,
            "width": 250,
            "height": 120,
            "color": "4" # Green
        },
        {
            "id": "wf_edit",
            "type": "file",
            "file": "SIGS-App/EditarLicencaScreen.md",
            "x": 2000,
            "y": 500,
            "width": 250,
            "height": 120,
            "color": "4" # Green
        }
    ]
    
    edges = [
        # Onboarding -> Dashboard
        {
            "id": "e_onboard_dash",
            "fromNode": "wf_onboarding",
            "fromSide": "right",
            "toNode": "wf_dashboard",
            "toSide": "left",
            "label": "Guide user to main panel"
        },
        # Config -> Dashboard / Alerts
        {
            "id": "e_config_alert",
            "fromNode": "wf_config",
            "fromSide": "right",
            "toNode": "wf_calendario",
            "toSide": "left",
            "label": "Custom alert lead times"
        },
        # Dashboard -> Cadastro (FAB button)
        {
            "id": "e_dash_cad",
            "fromNode": "wf_dashboard",
            "fromSide": "right",
            "toNode": "wf_cadastro",
            "toSide": "left",
            "label": "Register license (FAB)"
        },
        # Dashboard -> Calendario
        {
            "id": "e_dash_cal",
            "fromNode": "wf_dashboard",
            "fromSide": "bottom",
            "toNode": "wf_calendario",
            "toSide": "top",
            "label": "Check expiration dates"
        },
        # Dashboard -> Listing
        {
            "id": "e_dash_list",
            "fromNode": "wf_dashboard",
            "fromSide": "bottom",
            "toNode": "wf_licencas",
            "toSide": "left",
            "label": "Search & Filter"
        },
        # Cadastro -> SQLite DB
        {
            "id": "e_cad_db",
            "fromNode": "wf_cadastro",
            "fromSide": "right",
            "toNode": "wf_database",
            "toSide": "left",
            "label": "Insert license record"
        },
        # Database -> Zustand Store
        {
            "id": "e_db_store",
            "fromNode": "wf_database",
            "fromSide": "bottom",
            "toNode": "wf_licstore",
            "toSide": "top",
            "label": "Hydrate global memory state"
        },
        # Store -> Notification scheduler
        {
            "id": "e_store_noti",
            "fromNode": "wf_licstore",
            "fromSide": "right",
            "toNode": "wf_notifications",
            "toSide": "left",
            "label": "Register local system triggers"
        },
        # Notification -> Alerts helper
        {
            "id": "e_noti_helper",
            "fromNode": "wf_notifications",
            "fromSide": "bottom",
            "toNode": "wf_alertshelper",
            "toSide": "top",
            "label": "Compute target trigger dates"
        },
        # Alerts Helper -> Alerts Store
        {
            "id": "e_helper_store",
            "fromNode": "wf_alertshelper",
            "fromSide": "bottom",
            "toNode": "wf_alertsstore",
            "toSide": "top",
            "label": "Log seen/unseen notification IDs"
        },
        # Listing -> Details (select card)
        {
            "id": "e_list_det",
            "fromNode": "wf_licencas",
            "fromSide": "right",
            "toNode": "wf_detalhe",
            "toSide": "left",
            "label": "View details & audit logs"
        },
        # Details -> Inspecoes
        {
            "id": "e_det_insp",
            "fromNode": "wf_detalhe",
            "fromSide": "bottom",
            "toNode": "wf_inspecoes",
            "toSide": "top",
            "label": "Verify inspection history"
        },
        # Details -> Edit Screen
        {
            "id": "e_det_edit",
            "fromNode": "wf_detalhe",
            "fromSide": "bottom",
            "toNode": "wf_edit",
            "toSide": "top",
            "label": "Manage or renew license"
        },
        # Edit -> SQLite / Store sync
        {
            "id": "e_edit_store",
            "fromNode": "wf_edit",
            "fromSide": "left",
            "toNode": "wf_licstore",
            "toSide": "right",
            "label": "Push modifications & reschedule triggers"
        },
        # Listing -> Estabelecimentos Screen
        {
            "id": "e_list_estab",
            "fromNode": "wf_licencas",
            "fromSide": "bottom",
            "toNode": "wf_estabs",
            "toSide": "top",
            "label": "Browse facility details"
        }
    ]
    
    canvas_data = {
        "nodes": nodes,
        "edges": edges
    }
    
    canvas_path = os.path.join(VAULT_DIR, "SIGS Workflow.canvas")
    try:
        with open(canvas_path, 'w', encoding='utf-8') as cf:
            json.dump(canvas_data, cf, indent=2)
        print(f"Workflow Canvas successfully compiled at: {canvas_path}")
    except Exception as e:
        print(f"Error compiling workflow canvas: {e}")

def main():
    print("Starting Obsidian Sync & Canvas generation...")
    
    # Scan source files
    files = scan_files()
    print(f"Scanned {len(files)} files in workspace source folders.")
    
    # Parse dependencies
    dependencies = {}
    dependents = {}
    
    # Initialize dependents dict
    for f in files:
        dependencies[f] = []
        dependents[f] = []
        
    for f in files:
        imports = parse_imports(f)
        for imp in imports:
            if imp in files:
                dependencies[f].append(imp)
                
    # Build dependents (reverse mapping)
    for source, targets in dependencies.items():
        for target in targets:
            dependents[target].append(source)
            
    # Retrieve git info
    commits = get_git_commits()
    working_changes = get_working_changes()
    
    # Generate local Obsidian Markdown notes
    generate_vault_notes(files, dependencies, dependents, commits, working_changes)
    
    # Generate native Obsidian Canvas flow diagram
    generate_canvas(files, dependencies, commits, working_changes)
    
    # Generate native Obsidian Canvas workflow diagram
    generate_workflow_canvas(files)
    
    print("Sync complete.")

if __name__ == "__main__":
    main()
