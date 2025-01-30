import os

def combine_jsx_files(base_dir, output_file):
    """
    Combines all JSX files in the directory tree into a single file,
    using XML-style tags to mark file boundaries and metadata.
    
    Args:
        base_dir (str): Base directory to start searching from
        output_file (str): Path to the output file
    """
    # Ensure base directory exists
    if not os.path.exists(base_dir):
        print(f"Error: Directory '{base_dir}' does not exist")
        return

    # Create or overwrite output file
    with open(output_file, 'w', encoding='utf-8') as outfile:
        # Write XML header
        outfile.write('<?xml version="1.0" encoding="UTF-8"?>\n')
        outfile.write('<jsx_files>\n')
        
        # Walk through directory tree
        for root, dirs, files in os.walk(base_dir):
            # Filter for .jsx files
            jsx_files = [f for f in files if f.endswith('.jsx')]
            
            for file in jsx_files:
                # Get full file path
                file_path = os.path.join(root, file)
                # Get relative path from base directory
                rel_path = os.path.relpath(file_path, base_dir)
                
                # Write file start tag with metadata
                outfile.write(f'\n  <file_entry>\n')
                outfile.write(f'    <file_path>{rel_path}</file_path>\n')
                outfile.write(f'    <file_name>{file}</file_name>\n')
                outfile.write('    <content>\n')
                outfile.write('    <![CDATA[\n')  # Use CDATA to handle special characters
                
                # Read and write file content
                try:
                    with open(file_path, 'r', encoding='utf-8') as infile:
                        content = infile.read()
                        outfile.write(content)
                except Exception as e:
                    outfile.write(f'Error reading file: {str(e)}')
                
                # Write file end tags
                outfile.write('\n    ]]>\n')
                outfile.write('    </content>\n')
                outfile.write('  </file_entry>\n')

        # Write closing XML tag
        outfile.write('</jsx_files>\n')
        print(f"Combined JSX files have been written to {output_file}")

# Example usage
if __name__ == "__main__":
    # Get the directory where the script is located
    base_directory = os.path.dirname(os.path.abspath(__file__))
    output_path = "./all_project_code_files.xml"  # Changed extension to .xml
    
    combine_jsx_files(base_directory, output_path)