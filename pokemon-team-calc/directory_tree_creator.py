import os
from pathlib import Path

def generate_tree(startpath, output_file, exclude_dirs=None):
    if exclude_dirs is None:
        exclude_dirs = []

    with open(output_file, 'w', encoding='utf-8') as f:
        for root, dirs, files in os.walk(startpath):
            # Remove excluded directories
            dirs[:] = [d for d in dirs if d not in exclude_dirs]

            level = root.replace(startpath, '').count(os.sep)
            indent = '│   ' * (level - 1) + '├── ' if level > 0 else ''
            f.write(f'{indent}{os.path.basename(root)}/\n')
            
            subindent = '│   ' * level + '├── '
            for file in files:
                f.write(f'{subindent}{file}\n')

# Set the current directory as the starting path
current_dir = os.getcwd()

# Set the output file name
output_file = 'directory_tree.txt'

# Set directories to exclude
exclude_dirs = ['node_modules']

# Generate the tree
generate_tree(current_dir, output_file, exclude_dirs)

print(f"Directory tree has been written to {output_file}")
